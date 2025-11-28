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

    // El carrito YA tiene el precio final con comisión aplicada (se aplica en addItem)
    // Solo mapeamos los items sin modificar precios
    const items = cart.items.map((it) => {
      const meta = typeof it.metadata === 'object' && it.metadata !== null 
        ? it.metadata as Record<string, unknown> 
        : {};
      
      return {
        kind: it.kind,
        refId: it.refId,
        price: Number(it.price), // Precio YA incluye comisión
        currency: it.currency,
        quantity: it.quantity,
        metadata: meta,
      };
    });

    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

    return {
      currency: cart.currency,
      total: Number(total.toFixed(2)),
      items,
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
      console.log('[Checkout] Items en orden:', order.items.map(i => ({ kind: i.kind, refId: i.refId })));
      
      // HOTEL
      for (const it of order.items.filter((i) => i.kind === CartItemKind.HOTEL)) {
        const m = it.metadata as {
          hotelId: string;
          roomId: string;
          checkIn: string;
          checkOut: string;
          hotelName?: string;
        };
        const req: HotelReserveRequestDto = {
          hotelId: m.hotelId,
          roomId: m.roomId,
          clientId: dto.clientId,
          checkIn: m.checkIn,
          checkOut: m.checkOut,
          reservationId: reservation.id,
        };
        const res = await this.bookings.hotelsReserve(req);
        console.log('[Checkout] Hotel reservado:', res.hotelReservationId);
        hotelReservations.push({ hotelReservationId: res.hotelReservationId, expiresAt: res.expiresAt });
        
        // Guardar en HotelBooking para trazabilidad
        const hotelSupplier = await this.getOrCreateHotelSupplier();
        console.log('[Checkout] Guardando HotelBooking...');
        await this.prisma.hotelBooking.create({
          data: {
            bookingId: res.hotelReservationId,
            reservationId: reservation.id,
            clientId: dto.clientId,
            supplierId: hotelSupplier.id,
            propertyCode: m.hotelId,
            roomTypeCode: m.roomId,
            ratePlanCode: 'STANDARD',
            checkIn: new Date(m.checkIn),
            checkOut: new Date(m.checkOut),
            currency: dto.currency.toUpperCase(),
            totalAmount: Number(it.price),
            state: 'PENDIENTE',
            extBookingId: res.hotelReservationId,
          },
        });
      }

      // AIR
      for (const it of order.items.filter((i) => i.kind === CartItemKind.AIR)) {
        const m = it.metadata as {
          flightId: string;
          passengers: Array<{ name: string; doc?: string }>;
          originCityId?: string;
          destinationCityId?: string;
          departureAt?: string;
        };
        const req: AirlineReserveRequestDto = {
          flightId: m.flightId,
          reservationId: reservation.id,
          clientId: dto.clientId,
          passengers: (m.passengers || []).map((p) => ({
            name: p.name,
            doc: p.doc || dto.clientId,
          })),
        };
        const res = await this.bookings.airReserve(req);
        flightReservations.push({ flightReservationId: res.flightReservationId, expiresAt: res.expiresAt });
        
        // Guardar en FlightBooking para trazabilidad
        const airlineSupplier = await this.getOrCreateAirlineSupplier();
        await this.prisma.flightBooking.create({
          data: {
            pnr: res.flightReservationId,
            reservationId: reservation.id,
            clientId: dto.clientId,
            supplierId: airlineSupplier.id,
            origin: m.originCityId?.replace('CO-', '') || 'BOG',
            destination: m.destinationCityId?.replace('CO-', '') || 'MDE',
            departureAt: m.departureAt ? new Date(m.departureAt) : new Date(),
            currency: dto.currency.toUpperCase(),
            totalAmount: Number(it.price),
            state: 'PENDIENTE',
            extBookingId: res.flightReservationId,
            segments: m.passengers,
          },
        });
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

  // Helper: obtener o crear supplier de hotel
  private async getOrCreateHotelSupplier() {
    const existing = await this.prisma.hotelSupplier.findFirst({ where: { code: 'HOTEL-DEFAULT' } });
    if (existing) return existing;
    
    return this.prisma.hotelSupplier.create({
      data: {
        code: 'HOTEL-DEFAULT',
        name: 'Hotel Service Provider',
        baseUrl: process.env.HOTEL_BACKEND_URL || 'http://localhost:3002',
      },
    });
  }

  // Helper: obtener o crear supplier de aerolínea
  private async getOrCreateAirlineSupplier() {
    const existing = await this.prisma.airlineSupplier.findFirst({ where: { code: 'AIR-DEFAULT' } });
    if (existing) return existing;
    
    return this.prisma.airlineSupplier.create({
      data: {
        code: 'AIR-DEFAULT',
        name: 'Airline Service Provider',
        baseUrl: process.env.AIR_BACKEND_URL || 'http://localhost:3003',
      },
    });
  }
}