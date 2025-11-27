import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('sales')
  async getSales(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    console.debug('Get sales summary attempt from', start, 'to', end);
    return this.service.getSalesSummary(start, end);
  }

  @Get('reservations')
  async getReservations() {
    console.debug('Get reservations summary attempt');
    return this.service.getReservationsSummary();
  }
}

