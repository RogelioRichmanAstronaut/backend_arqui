import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    process.env.MAILER_MODE = 'simulated';

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should send booking confirmation (simulated)', async () => {
    const res = await service.sendBookingConfirmation('test@example.com', 'ORD-1', {
      clientName: 'Alice',
      totalAmount: 123.45,
      currency: 'USD',
    });

    expect(res.sent).toBeTruthy();
    const sent = service.getSent();
    expect(sent.length).toBeGreaterThan(0);
    expect(sent[0].to).toBe('test@example.com');
    expect(sent[0].subject).toContain('Confirmación');
  });
});
