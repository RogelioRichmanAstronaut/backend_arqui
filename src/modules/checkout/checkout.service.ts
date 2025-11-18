import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutQuoteRequestDto, CheckoutQuoteResponseDto } from './dtos/checkout-quote.dto';
import { CheckoutConfirmRequestDto, CheckoutConfirmResponseDto } from './dtos/checkout-confirm.dto';

import { BookingsService } from '../bookings/bookings.service';
import { PaymentsService } from '../payments/payments.service';

// DTOs de bookings (Paso 3)
import { HotelReserveRequestDto } from '../bookings/dtos/hotel-reserve.dto';
import { AirlineReserveRequestDto } from '../bookings/dtos/airline-reserve.dto';

// DTOs de pagos (Paso 2)
import { BankInitiatePaymentRequestDto } from '../payments/dtos/bank-initiate.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly payments: PaymentsService,
  ) {}

  async quote(dto: CheckoutQuoteRequestDto): Promise<CheckoutQuoteResponseDto> {
    const cart = dto.cartId
      ? await this.prisma.cart.findUnique({ where: { id: dto.cartId }, include: { items: true } })
      : await this.prisma.cart.findFirst({ where: { clientId: dto.clientId }, include: { items: true } });

    if (!cart || cart.items.length === 0) {
      return { currency: 'COP', total: 0, items: [] };
    }
    const total = cart.items.reduce((s: number, it: { price: number; quantity: number }): number => s + Number(it.price) * it.quantity, 0);
    return {
      currency: cart.currency,
      total,
      items: cart.items.map((it: any) => ({
        kind: it.kind,
        refId: it.refId,
        price: Number(it.price),
        currency: it.currency,
        quantity: it.quantity,
        metadata: it.metadata ?? {},
      })),
    };
  }

  async confirm(dto: CheckoutConfirmRequestDto, idemKey?: string): Promise<CheckoutConfirmResponseDto> {
    // 1) Cargar carrito
    const cart = await this.prisma.cart.findUnique({ where: { id: dto.cartId }, include: { items: true } });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Carrito vacío o no existe');
    if (cart.clientId !== dto.clientId) throw new BadRequestException('El carrito no corresponde al clientId');
    if (cart.currency.toUpperCase() !== dto.currency.toUpperCase()) {
      throw new BadRequestException('La moneda del carrito no coincide con la solicitada');
    }
    const total = cart.items.reduce((s: number, it: { price: number; quantity: number }) => s + Number(it.price) * it.quantity, 0);

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

    // 3) Crear Reservation + Order
    const reservation = await this.prisma.reservation.create({
      data: {
        clientId: dto.clientId,
        currency: dto.currency.toUpperCase(),
        totalAmount: total,
        state: 'PENDIENTE',
      },
    });

    const order = await this.prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        clientId: dto.clientId,
        currency: dto.currency.toUpperCase(),
        totalAmount: total,
        reservationId: reservation.id,
        idempotencyKey: idemKey ?? null,
        items: {
          create: cart.items.map((it: CartItem) => ({
            kind: it.kind,
            refId: it.refId,
            price: it.price,
            currency: it.currency,
            metadata: it.metadata as Record<string, any>,
          })),
        },
      },
      include: { items: true },
    });

interface CartItem {
  kind: string;
  refId: string;
  price: number;
  currency: string;
  metadata: Record<string, any> | null;
}

    // 4) Reservas proveedor (no confirmamos todavía)
    const hotelReservations: Array<{ hotelReservationId: string; expiresAt: string }> = [];
    const flightReservations: Array<{ flightReservationId: string; expiresAt: string }> = [];

    try {
      // HOTEL
    for (const it of order.items.filter((i: { kind: string }) => i.kind === 'HOTEL')) {
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
    for (const it of order.items.filter((i: { kind: string }) => i.kind === 'AIR')) {
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