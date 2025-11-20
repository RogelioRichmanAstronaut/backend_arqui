import { Injectable, Logger } from '@nestjs/common';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly mode: 'simulated' | 'smtp';
  private sent: MailOptions[] = [];
  private transporter: any;

  constructor() {
    const mode = (process.env.MAILER_MODE || 'simulated').toLowerCase();
    this.mode = mode === 'smtp' ? 'smtp' : 'simulated';

    if (this.mode === 'smtp') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodemailer = require('nodemailer');
        this.transporter = nodemailer.createTransport({
          host: process.env.MAILER_SMTP_HOST,
          port: Number(process.env.MAILER_SMTP_PORT) || 587,
          secure: process.env.MAILER_SMTP_SECURE === 'true',
          auth: process.env.MAILER_SMTP_USER
            ? {
                user: process.env.MAILER_SMTP_USER,
                pass: process.env.MAILER_SMTP_PASS,
              }
            : undefined,
        });
        this.logger.log('NotificationsService mailer initialized in SMTP mode');
      } catch (err) {
        this.logger.warn('nodemailer not installed — falling back to simulated mode');
        (this as any).mode = 'simulated';
      }
    } else {
      this.logger.log('NotificationsService mailer initialized in simulated mode');
    }
  }

  private async sendMail(opts: MailOptions) {
    if (this.mode === 'simulated') {
      this.logger.log(`[MAILER simulated] To: ${opts.to} Subject: ${opts.subject}`);
      this.sent.push(opts);
      return { accepted: [opts.to], messageId: `simulated-${Date.now()}` };
    }

    if (!this.transporter) {
      this.logger.error('SMTP transporter not configured');
      throw new Error('SMTP transporter not configured');
    }

    const info = await this.transporter.sendMail({
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      from: process.env.MAILER_FROM || 'no-reply@example.com',
    });

    this.logger.log(`[MAILER smtp] Message sent: ${info.messageId}`);
    return info;
  }

  // exposed for tests / inspection
  getSent() {
    return this.sent.slice();
  }

  async sendBookingConfirmation(email: string, orderId: string, details?: Record<string, any>) {
    const subject = `Confirmación de reserva ${orderId}`;
    const text = `Hola ${details?.clientName || ''},\nTu reserva ${orderId} por ${details?.totalAmount} ${details?.currency} ha sido confirmada.`;
    const html = `<p>Hola ${details?.clientName || ''},</p><p>Tu reserva <b>${orderId}</b> por <b>${details?.totalAmount} ${details?.currency}</b> ha sido confirmada.</p>`;

    const info = await this.sendMail({ to: email, subject, text, html });
    this.logger.log(`[EMAIL] Booking confirmation sent to ${email} (id=${(info as any).messageId})`);
    return { sent: true, to: email, orderId, info };
  }

  async sendPaymentNotification(email: string, transactionId: string, status: string) {
    const subject = `Pago ${transactionId} - ${status}`;
    const text = `Tu pago ${transactionId} tiene estado: ${status}`;
    const info = await this.sendMail({ to: email, subject, text });
    this.logger.log(`[EMAIL] Payment notification sent to ${email}`);
    return { sent: true, to: email, transactionId, status, info };
  }

  async sendCancellationNotification(email: string, orderId: string, reason?: string) {
    const subject = `Cancelación de reserva ${orderId}`;
    const text = `Tu reserva ${orderId} ha sido cancelada.${reason ? ` Motivo: ${reason}` : ''}`;
    const info = await this.sendMail({ to: email, subject, text });
    this.logger.log(`[EMAIL] Cancellation notification sent to ${email}`);
    return { sent: true, to: email, orderId, reason, info };
  }
}

