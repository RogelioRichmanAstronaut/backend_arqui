import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BankHttpAdapter } from './adapters/bank-http.adapter';
import { PaymentState, ReservationState, BookingState } from '@prisma/client';
import { BankSignatureService } from './services/bank-signature.service';
import { bankConfig } from './bank.config';
import { OutboxPublisher } from './outbox/outbox.publisher';
import { BookingsService } from '../bookings/bookings.service';

import {
  BankInitiatePaymentRequestDto,
  BankInitiatePaymentResponseDto,
} from './dtos/bank-initiate.dto';
import {
  BankPaymentNotificationDto,
  BankAckResponseDto,
} from './dtos/bank-notify.dto';
import {
  BankStatusRequestDto,
  BankStatusResponseDto,
} from './dtos/bank-status.dto';
import {
  BankRefundRequestDto,
  BankRefundResponseDto,
} from './dtos/bank-refund.dto';
import {
  BankValidateReceiptRequestDto,
  BankValidateReceiptResponseDto,
} from './dtos/bank-validate-receipt.dto';

@Injectable()
export class PaymentsService {
  private bank = new BankHttpAdapter();
  private cfg = bankConfig();
  private outbox: OutboxPublisher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sig: BankSignatureService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookings: BookingsService,
  ) {
    this.outbox = new OutboxPublisher(prisma);
  }

  // INIT PAYMENT
  async initiate(
    dto: BankInitiatePaymentRequestDto,
    idempotencyKey?: string,
  ): Promise<BankInitiatePaymentResponseDto> {
    // 1) Resolver reserva por PK (id) o business id (reservationId)
    const byPk = await this.prisma.reservation.findUnique({ where: { id: dto.reservationId } });
    const reservation =
      byPk ??
      (await this.prisma.reservation.findUnique({
        where: { reservationId: dto.reservationId },
      }));
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    if (reservation.state !== 'PENDIENTE') {
      throw new BadRequestException('Reserva no está PENDIENTE');
    }

    // 2) Coherencia con payload
    const client = await this.prisma.client.findUnique({ where: { id: reservation.clientId } });
    if (!client) throw new NotFoundException('Cliente de la reserva no encontrado');

    if (client.clientId !== dto.clientId) {
      throw new BadRequestException('clientId del payload no coincide con la reserva');
    }
    const amount = Number(reservation.totalAmount);
    if (amount !== Number(dto.totalAmount)) {
      throw new BadRequestException('totalAmount del payload no coincide con la reserva');
    }
    if (reservation.currency.toUpperCase() !== dto.currency.toUpperCase()) {
      throw new BadRequestException('currency del payload no coincide con la reserva');
    }

    // 3) Idempotencia
    if (idempotencyKey) {
      const idem = await this.prisma.paymentAttempt.findUnique({ where: { idempotencyKey } });
      if (idem) {
        return {
          paymentAttemptId: idem.paymentAttemptExtId ?? 'unknown',
          bankPaymentUrl: dto.returnUrl, // no lo tenemos guardado; el banco lo devuelve en el primer init
          initialState: 'PENDIENTE',
          expiresAt: new Date(idem.createdAt).toISOString(),
        };
      }
    }

    // 4) Crear attempt local (PENDIENTE)
    const attempt = await this.prisma.paymentAttempt.create({
      data: {
        reservationId: reservation.id,
        idempotencyKey: idempotencyKey ?? null,
        state: 'PENDIENTE',
        totalAmount: reservation.totalAmount,
        currency: reservation.currency,
        returnUrl: dto.returnUrl,
        callbackUrl: dto.callbackUrl ?? this.cfg.webhookCallbackUrl,
      },
    });

    await this.outbox.publish({
      aggregateType: 'Payment',
      aggregateId: attempt.id,
      type: 'PaymentAttemptCreated',
      payload: { reservationId: reservation.id, attemptId: attempt.id },
    });

    // 5) Llamar al banco
    const res = await this.bank.initiatePayment({
      reservationId: reservation.reservationId, // business id
      clientId: client.clientId,
      currency: reservation.currency,
      totalAmount: amount,
      description: dto.description,
      returnUrl: dto.returnUrl,
      callbackUrl: dto.callbackUrl ?? this.cfg.webhookCallbackUrl,
      idempotencyKey,
    });

    // 6) Persistir id externo
    await this.prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { paymentAttemptExtId: res.paymentAttemptExtId },
    });

    return {
      paymentAttemptId: res.paymentAttemptExtId,
      bankPaymentUrl: res.bankPaymentUrl,
      initialState: 'PENDIENTE',
      expiresAt: res.expiresAt,
    };
  }

  // WEBHOOK / NOTIFICATION
  async handleNotification(
    dto: BankPaymentNotificationDto,
    rawBody?: string,
  ): Promise<BankAckResponseDto> {
    // 1) Verificar firma usando el raw body si está disponible
    const material = rawBody ?? JSON.stringify(dto);
    this.sig.verify(dto.signature, material);

    const newState = String(dto.state).toUpperCase();
    const paymentAttemptExtId = dto.paymentAttemptId;

    // 2) Ubicar attempt
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { paymentAttemptExtId },
      include: { reservation: true },
    });
    if (!attempt) throw new NotFoundException('PaymentAttempt no encontrado');

    // 3) Upsert transacción por transactionId
    const tx = await this.prisma.transaction.upsert({
      where: { transactionId: dto.transactionId },
      create: {
        transactionId: dto.transactionId,
        paymentAttemptId: attempt.id,
        state: newState as any,
        authCode: dto.authCode ?? null,
        receiptRef: dto.receiptRef ?? null,
        totalAmount: Number(dto.totalAmount),
        currency: dto.currency,
        transactionAt: new Date(dto.transactionAt),
      },
      update: {
        state: newState as any,
        authCode: dto.authCode ?? null,
        receiptRef: dto.receiptRef ?? null,
      },
    });

    // 4) Actualizar estados + publicar eventos
    await this.prisma.$transaction(async (db) => {
      await db.paymentAttempt.update({
        where: { id: attempt.id },
        data: { state: newState as PaymentState },
      });

      if (newState === 'APROBADA') {
        await db.reservation.update({
          where: { id: attempt.reservationId },
          data: { state: ReservationState.APROBADA },
        });
        await this.outbox.publish({
          aggregateType: 'Payment',
          aggregateId: attempt.id,
          type: 'PaymentApproved',
          payload: { transactionId: tx.transactionId, reservationId: attempt.reservationId },
        });
      } else if (newState === 'DENEGADA' || newState === 'CANCELADA') {
        await db.reservation.update({
          where: { id: attempt.reservationId },
          data: { state: 'DENEGADA' },
        });
        await this.outbox.publish({
          aggregateType: 'Payment',
          aggregateId: attempt.id,
          type: 'PaymentDenied',
          payload: { transactionId: tx.transactionId, reason: newState },
        });
      }
    });

    return { recibido: 'OK', ackId: tx.id };
  }

  // STATUS
  async status(q: BankStatusRequestDto): Promise<BankStatusResponseDto> {
    // 1) Intentar local (Transaction por transactionId)
    const t = await this.prisma.transaction.findUnique({
      where: { transactionId: q.transactionId },
    });
    if (t) {
      return {
        state: t.state as any,
        stateDetail: '',
        totalAmount: Number(t.totalAmount),
        currency: t.currency,
        authCode: t.authCode ?? '',
        receiptRef: t.receiptRef ?? '',
        lastUpdateAt: (t.updatedAt ?? t.createdAt).toISOString(),
      };
    }

    // 2) Fallback al banco
    const remote = await this.bank.getStatus({
      transactionId: q.transactionId,
      paymentAttemptExtId: q.paymentAttemptId,
    });
    
    // 3) Si el banco dice APROBADA, sincronizar reservación automáticamente
    //    (esto cubre el caso de que el webhook no llegó)
    //    Usar transactionId como paymentAttemptExtId si no se pasó paymentAttemptId
    const extId = q.paymentAttemptId || q.transactionId;
    if (remote.state === 'APROBADA' && extId) {
      await this.syncReservationState(extId, remote);
    }
    
    return {
      state: remote.state as any,
      stateDetail: remote.stateDetail ?? '',
      totalAmount: remote.totalAmount,
      currency: remote.currency,
      authCode: remote.authCode ?? '',
      receiptRef: remote.receiptRef ?? '',
      lastUpdateAt: remote.lastUpdateAt,
    };
  }
  
  // SYNC - Sincronizar estado de reservación cuando el webhook no llegó
  private async syncReservationState(
    paymentAttemptExtId: string,
    bankResponse: { state: string; authCode?: string; receiptRef?: string; totalAmount: number; currency: string; lastUpdateAt: string },
  ) {
    try {
      const attempt = await this.prisma.paymentAttempt.findFirst({
        where: { paymentAttemptExtId },
        include: { reservation: true },
      });
      
      if (!attempt) {
        console.warn(`[Sync] PaymentAttempt ${paymentAttemptExtId} no encontrado`);
        return;
      }
      
      // Solo sincronizar si la reservación sigue PENDIENTE
      if (attempt.reservation.state !== 'PENDIENTE') {
        console.log(`[Sync] Reservación ${attempt.reservationId} ya está en ${attempt.reservation.state}`);
        // Aun así, confirmar bookings si no lo están
        await this.confirmBookingsForReservation(attempt.reservationId, paymentAttemptExtId);
        return;
      }
      
      console.log(`[Sync] Actualizando reservación ${attempt.reservationId} de PENDIENTE a APROBADA`);
      
      // Crear transacción local si no existe
      const existingTx = await this.prisma.transaction.findFirst({
        where: { paymentAttemptId: attempt.id },
      });
      
      if (!existingTx) {
        await this.prisma.transaction.create({
          data: {
            transactionId: paymentAttemptExtId,
            paymentAttemptId: attempt.id,
            state: 'APROBADA',
            authCode: bankResponse.authCode ?? null,
            receiptRef: bankResponse.receiptRef ?? null,
            totalAmount: bankResponse.totalAmount,
            currency: bankResponse.currency,
            transactionAt: new Date(bankResponse.lastUpdateAt),
          },
        });
      }
      
      // Actualizar estados
      await this.prisma.$transaction([
        this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: { state: 'APROBADA' },
        }),
        this.prisma.reservation.update({
          where: { id: attempt.reservationId },
          data: { state: 'APROBADA' },
        }),
      ]);
      
      console.log(`[Sync] ✅ Reservación ${attempt.reservationId} actualizada a APROBADA`);
      
      // Confirmar bookings de hotel y vuelo con los proveedores
      await this.confirmBookingsForReservation(attempt.reservationId, paymentAttemptExtId);
    } catch (err) {
      console.error('[Sync] Error sincronizando estado:', err);
    }
  }
  
  // Confirmar bookings de hotel y vuelo con los proveedores externos
  private async confirmBookingsForReservation(reservationId: string, transactionId: string) {
    try {
      // Buscar hotel bookings pendientes
      const hotelBookings = await this.prisma.hotelBooking.findMany({
        where: { reservationId, state: BookingState.PENDIENTE },
      });
      
      for (const hb of hotelBookings) {
        try {
          console.log(`[Sync] Confirmando hotel booking ${hb.bookingId}...`);
          await this.bookings.hotelsConfirm({
            hotelReservationId: hb.extBookingId || hb.bookingId,
            transactionId,
          });
          
          // Actualizar estado en nuestra BD
          await this.prisma.hotelBooking.update({
            where: { id: hb.id },
            data: { state: BookingState.APROBADA },
          });
          console.log(`[Sync] ✅ Hotel booking ${hb.bookingId} confirmado`);
        } catch (err) {
          console.error(`[Sync] Error confirmando hotel ${hb.bookingId}:`, err);
        }
      }
      
      // Buscar flight bookings pendientes
      const flightBookings = await this.prisma.flightBooking.findMany({
        where: { reservationId, state: BookingState.PENDIENTE },
      });
      
      for (const fb of flightBookings) {
        try {
          console.log(`[Sync] Confirmando flight booking ${fb.pnr}...`);
          await this.bookings.airConfirm({
            flightReservationId: fb.extBookingId || fb.pnr,
            transactionId,
          });
          
          // Actualizar estado en nuestra BD
          await this.prisma.flightBooking.update({
            where: { id: fb.id },
            data: { state: BookingState.APROBADA },
          });
          console.log(`[Sync] ✅ Flight booking ${fb.pnr} confirmado`);
        } catch (err) {
          console.error(`[Sync] Error confirmando flight ${fb.pnr}:`, err);
        }
      }
    } catch (err) {
      console.error('[Sync] Error confirmando bookings:', err);
    }
  }

  // REFUND
  async refund(dto: BankRefundRequestDto): Promise<BankRefundResponseDto> {
    const result = await this.bank.refund({
      transactionId: dto.transactionId,
      amount: Number(dto.refundAmount),
    });

    const tx = await this.prisma.transaction.findUnique({
      where: { transactionId: dto.transactionId },
    });
    if (!tx) throw new NotFoundException('Transacción no encontrada');

    const refund = await this.prisma.refund.create({
      data: {
        refundId: result.refundId,
        transactionId: tx.id,
        amount: Number(dto.refundAmount),
        state: result.refundState as any,
        refundedAt: new Date(result.refundedAt),
      },
    });

    await this.outbox.publish({
      aggregateType: 'Payment',
      aggregateId: tx.paymentAttemptId,
      type: 'RefundCreated',
      payload: {
        refundId: refund.refundId,
        transactionId: dto.transactionId,
        amount: Number(dto.refundAmount),
      },
    });

    return {
      refundId: refund.refundId,
      refundState: refund.state as any,
      receiptRef: result.receiptRef ?? '',
      refundedAt: refund.refundedAt.toISOString(),
    };
  }

  // VALIDATE RECEIPT
  async validateReceipt(
    dto: BankValidateReceiptRequestDto,
  ): Promise<BankValidateReceiptResponseDto> {
    const r = await this.bank.validateReceipt({
      transactionId: dto.transactionId,
      expectedAmount: Number(dto.expectedAmount),
    });
    return {
      valid: r.valid ? 'SI' : 'NO',
      detail: r.detail ?? '',
    };
  }
}