import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('*/10 * * * * *')
  async handleOutboxEvents() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const events = await this.prisma.outbox.findMany({
        where: { publishedAt: null },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length > 0) {
        this.logger.log(`Processing ${events.length} outbox events`);
      }

      for (const event of events) {
        await this.processEvent(event);
        await this.prisma.outbox.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });
      }
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: any) {
    const payload = typeof event.payload === 'string' 
      ? JSON.parse(event.payload) 
      : event.payload;

    switch (event.type) {
      case 'PaymentApproved':
        await this.handlePaymentApproved(payload);
        break;
      case 'PaymentDenied':
        this.logger.warn(`Payment denied for transaction ${payload.transactionId}`);
        break;
      case 'RefundCreated':
        this.logger.log(`Refund created: ${payload.refundId}`);
        break;
      default:
        this.logger.debug(`Event type ${event.type} ignored`);
    }
  }

  private async handlePaymentApproved(payload: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: payload.reservationId },
      include: { client: true },
    });

    if (!reservation) {
      this.logger.error(`Reservation ${payload.reservationId} not found`);
      return;
    }

    if (!reservation.client.email) {
      this.logger.warn(`Client ${reservation.client.clientId} has no email`);
      return;
    }

    await this.notifications.sendBookingConfirmation(
      reservation.client.email,
      reservation.reservationId,
      {
        clientName: reservation.client.name,
        totalAmount: Number(reservation.totalAmount),
        currency: reservation.currency,
      }
    );

    this.logger.log(`Payment approved notification sent for reservation ${reservation.reservationId}`);
  }
}

