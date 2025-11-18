import { PrismaService } from '../../../prisma/prisma.service';

export class OutboxPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(event: {
    aggregateType: 'Reservation' | 'Payment';
    aggregateId: string;
    type: string;
    payload: Record<string, any>;
  }) {
    await this.prisma.outbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        type: event.type,
        payload: event.payload as any,
      },
    });
  }
}