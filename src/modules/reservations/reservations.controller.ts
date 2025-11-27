import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { CancelReservationDto } from './dtos/cancel-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    console.debug('Create reservation attempt with DTO:', dto);
    return this.service.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    console.debug('Get reservation attempt for id:', id);
    return this.service.getById(id);
  }

  @Get()
  listByClient(@Query('clientUuid') clientUuid: string) {
    console.debug('List reservations attempt for clientUuid:', clientUuid);
    return this.service.listByClient(clientUuid);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelReservationDto) {
    console.debug('Cancel reservation attempt for id:', id, 'with DTO:', dto);
    return this.service.cancel(id, dto);
  }
}