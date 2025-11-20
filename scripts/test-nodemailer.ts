import nodemailer from 'nodemailer';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

(async () => {
  try {
    console.log('Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();

    // Configure env vars so NotificationsService will create an SMTP transporter
    process.env.MAILER_MODE = 'smtp';
    process.env.MAILER_SMTP_HOST = testAccount.smtp.host;
    process.env.MAILER_SMTP_PORT = String(testAccount.smtp.port);
    process.env.MAILER_SMTP_SECURE = testAccount.smtp.secure ? 'true' : 'false';
    process.env.MAILER_SMTP_USER = testAccount.user;
    process.env.MAILER_SMTP_PASS = testAccount.pass;
    process.env.MAILER_FROM = 'no-reply@example.com';

    console.log('Instantiating NotificationsService...');
    const svc = new NotificationsService();

    console.log('Sending booking confirmation via NotificationsService (SMTP)...');
    const res = await svc.sendBookingConfirmation('recipient@example.com', 'ORD-ETH-1', {
      clientName: 'Ethereal Tester',
      totalAmount: 12.34,
      currency: 'USD',
    });

    console.log('Send result:', res);
    const preview = nodemailer.getTestMessageUrl(res.info);
    console.log('Preview URL:', preview);
    console.log('Open the Preview URL in your browser to view the message.');
  } catch (err) {
    console.error('Error sending test email:', err);
    process.exitCode = 1;
  }
})();
