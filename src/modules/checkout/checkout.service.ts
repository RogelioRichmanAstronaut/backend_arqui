import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutQuoteRequestDto, CheckoutQuoteResponseDto } from './dtos/checkout-quote.dto';
import { CheckoutConfirmRequestDto, CheckoutConfirmResponseDto } from './dtos/checkout-confirm.dto';

import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';
import { MarginsService } from '../margins/margins.service';

// DTOs de bookings (Paso 3)
import { HotelReserveRequestDto } from '../bookings/dtos/hotel-reserve.dto';
import { AirlineReserveRequestDto } from '../bookings/dtos/airline-reserve.dto';

// DTOs de pagos (Paso 2)
import { BankInitiatePaymentRequestDto } from '../payments/dtos/bank-initiate.dto';

// Tipos Prisma
import { Prisma, CartItemKind } from '@prisma/client';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly payments: PaymentsService,
    private readonly margins: MarginsService,
  ) {}

  async quote(dto: CheckoutQuoteRequestDto): Promise<CheckoutQuoteResponseDto> {
    const cart = dto.cartId
      ? await this.prisma.cart.findUnique({ where: { id: dto.cartId }, include: { items: true } })
      : await this.prisma.cart.findFirst({ where: { clientId: dto.clientId }, include: { items: true } });

    if (!cart || cart.items.length === 0) {
      return { currency: 'COP', total: 0, items: [] };
    }

    // Aplicar márgenes a cada item
    const itemsWithMargin = cart.items.map((it) => {
      const basePrice = Number(it.price);
      const marginCalc = this.margins.applyMargin(basePrice, it.kind as CartItemKind);
      
      return {
        kind: it.kind,
        refId: it.refId,
        price: marginCalc.final, // Precio final con margen
        currency: it.currency,
        quantity: it.quantity,
        metadata: {
          ...(typeof it.metadata === 'object' && it.metadata !== null ? it.metadata as Record<string, unknown> : {}),
          pricing: {
            basePrice: marginCalc.base,
            margin: marginCalc.margin,
            finalPrice: marginCalc.final,
          },
        },
      };
    });

    const total = itemsWithMargin.reduce((s, it) => s + it.price * it.quantity, 0);

    return {
      currency: cart.currency,
      total: Number(total.toFixed(2)),
      items: itemsWithMargin,
    };
  }

  async confirm(dto: CheckoutConfirmRequestDto, idemKey?: string): Promise<CheckoutConfirmResponseDto> {
    // 0) Buscar cliente por clientId (CC-XXX) para obtener su UUID
    const client = await this.prisma.client.findFirst({
      where: { clientId: dto.clientId, isDeleted: false },
    });
    if (!client) {
      throw new NotFoundException(`Cliente ${dto.clientId} no encontrado`);
    }

    // 1) Cargar carrito
    const cart = await this.prisma.cart.findUnique({ where: { id: dto.cartId }, include: { items: true } });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Carrito vacío o no existe');
    if (cart.clientId !== dto.clientId) throw new BadRequestException('El carrito no corresponde al clientId');
    if (cart.currency.toUpperCase() !== dto.currency.toUpperCase()) {
      throw new BadRequestException('La moneda del carrito no coincide con la solicitada');
    }
    const total = cart.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);

    // 2) Idempotencia (Order)
    if (idemKey) {
      const prev = await this.prisma.order.findFirst({ where: { idempotencyKey: idemKey } });
      if (prev) {
        // Buscar último intento de pago asociado a la reservation
        const attempt = await this.prisma.paymentAttempt.findFirst({
          where: { reservationId: prev.reservationId },
          orderBy: { createdAt: 'desc' },
        });
        if (attempt?.paymentAttemptExtId) {
          return {
            reservationId: prev.reservationId,
            orderId: prev.id,
            totalAmount: Number(prev.totalAmount),
            currency: prev.currency,
            paymentAttemptId: attempt.paymentAttemptExtId,
            bankPaymentUrl: attempt.returnUrl ?? '',
            initialState: 'PENDIENTE',
            expiresAt: attempt.createdAt.toISOString(),
            hotelReservations: [],
            flightReservations: [],
          };
        }
      }
    }

    // 3) Crear Reservation + Order (usando UUID del cliente, no el clientId)
    const reservation = await this.prisma.reservation.create({
      data: {
        reservationId: `RSV-${Date.now()}`,
        clientId: client.id,  // UUID del cliente
        currency: dto.currency.toUpperCase(),
        totalAmount: total,
        state: 'PENDIENTE',
      },
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        clientId: client.id,  // UUID del cliente
        currency: dto.currency.toUpperCase(),
        totalAmount: total,
        reservationId: reservation.id,
        idempotencyKey: idemKey ?? null,
        items: {
          create: cart.items.map((it) => ({
            kind: it.kind as CartItemKind,
            refId: it.refId,
            price: Number(it.price),
            currency: it.currency,
            metadata: it.metadata ?? {},
          })),
        },
      },
      include: { items: true },
    });

    // 4) Reservas proveedor (no confirmamos todavía)
    const hotelReservations: Array<{ hotelReservationId: string; expiresAt: string }> = [];
    const flightReservations: Array<{ flightReservationId: string; expiresAt: string }> = [];

    try {
      // HOTEL
    for (const it of order.items.filter((i) => i.kind === CartItemKind.HOTEL)) {
      const m = it.metadata as {
        hotelId: string;
        roomId: string;
        checkIn: string;
        checkOut: string;
      };
      const req: HotelReserveRequestDto = {
        hotelId: m.hotelId,
        roomId: m.roomId,
        clientId: dto.clientId,
        checkIn: m.checkIn,
        checkOut: m.checkOut,
        reservationId: reservation.id,
      };
      const res: { hotelReservationId: string; expiresAt: string } = await this.bookings.hotelsReserve(req);
      hotelReservations.push({ hotelReservationId: res.hotelReservationId, expiresAt: res.expiresAt });
    }

      // AIR
    for (const it of order.items.filter((i) => i.kind === CartItemKind.AIR)) {
      const m = it.metadata as {
        flightId: string;
        passengers: Array<{ name: string; age: number; seat: string }>;
      };
      const req: AirlineReserveRequestDto = {
        flightId: m.flightId,
        reservationId: reservation.id,
        clientId: dto.clientId,
        passengers: m.passengers.map((p: { name: string; age: number; seat: string }) => ({
          name: p.name,
          doc: '', // Add logic to populate 'doc' as needed
        })),
      };
      const res: { flightReservationId: string; expiresAt: string } = await this.bookings.airReserve(req);
      flightReservations.push({ flightReservationId: res.flightReservationId, expiresAt: res.expiresAt });
    }
    } catch (e) {
      // Falla durante reservas → marcar fallido
      await this.prisma.order.update({ where: { id: order.id }, data: { state: 'FAILED' } });
      await this.prisma.reservation.update({ where: { id: reservation.id }, data: { state: 'DENEGADA' } });
      throw e;
    }

    // 5) Iniciar pago
    const payReq: BankInitiatePaymentRequestDto = {
      reservationId: reservation.id,
      clientId: dto.clientId,
      totalAmount: total,
      currency: dto.currency.toUpperCase(),
      description: dto.description,
      returnUrl: dto.returnUrl,
      callbackUrl: dto.callbackUrl,
    };
    const payRes = await this.payments.initiate(payReq, idemKey);

    // 6) Dejar Order en PENDING_PAYMENT
    await this.prisma.order.update({ where: { id: order.id }, data: { state: 'PENDING_PAYMENT' } });

    // (Opcional) limpiar carrito
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return {
      reservationId: reservation.id,
      orderId: order.id,
      totalAmount: total,
      currency: dto.currency.toUpperCase(),
      paymentAttemptId: payRes.paymentAttemptId,
      bankPaymentUrl: payRes.bankPaymentUrl,
      initialState: payRes.initialState,
      expiresAt: payRes.expiresAt,
      hotelReservations,
      flightReservations,
    };
  }
}