import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const byState = orders.reduce((acc: Record<string, number>, order) => {
      acc[order.state] = (acc[order.state] || 0) + 1;
      return acc;
    }, {});

    const hotelItems = orders.flatMap(o => o.items.filter(i => i.kind === 'HOTEL'));
    const airItems = orders.flatMap(o => o.items.filter(i => i.kind === 'AIR'));

    return {
      period: {
        start: startDate?.toISOString() || 'all-time',
        end: endDate?.toISOString() || 'now',
      },
      summary: {
        totalOrders,
        totalRevenue,
        ordersByState: byState,
        itemsBreakdown: {
          hotels: hotelItems.length,
          flights: airItems.length,
        },
      },
    };
  }

  async getReservationsSummary() {
    const reservations = await this.prisma.reservation.findMany();
    
    const byState = reservations.reduce((acc: Record<string, number>, res) => {
      acc[res.state] = (acc[res.state] || 0) + 1;
      return acc;
    }, {});

    const totalAmount = reservations.reduce((sum, res) => sum + Number(res.totalAmount), 0);

    return {
      total: reservations.length,
      byState,
      totalAmount,
    };
  }
}

