import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendBookingConfirmation(email: string, orderId: string, details?: Record<string, any>) {
    // Mock de envío de email
    this.logger.log(`[EMAIL] Enviando confirmación de Orden ${orderId} a ${email}`);
    if (details) {
      this.logger.debug(`Detalles: ${JSON.stringify(details)}`);
    }
    return { sent: true, to: email, orderId };
  }

  async sendPaymentNotification(email: string, transactionId: string, status: string) {
    this.logger.log(`[EMAIL] Notificando pago ${transactionId} (${status}) a ${email}`);
    return { sent: true, to: email, transactionId, status };
  }

  async sendCancellationNotification(email: string, orderId: string, reason?: string) {
    this.logger.log(`[EMAIL] Notificando cancelación de ${orderId} a ${email}${reason ? `: ${reason}` : ''}`);
    return { sent: true, to: email, orderId, reason };
  }
}

