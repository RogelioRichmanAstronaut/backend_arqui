import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { CancelReservationDto } from './dtos/cancel-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto) {
    // asegurar que el cliente existe y no está borrado
    // Soporta tanto UUID como clientId (CC-XXXXX)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.clientUuid);
    
    const client = await this.prisma.client.findFirst({
      where: isUUID 
        ? { id: dto.clientUuid, isDeleted: false }
        : { clientId: dto.clientUuid, isDeleted: false },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    return this.prisma.reservation.create({
      data: {
        reservationId: crypto.randomUUID(), // business id
        clientId: client.id,
        currency: dto.currency.toUpperCase(),
        totalAmount: dto.totalAmount,
        note: dto.note,
        // state = PENDIENTE por default (schema)
      },
    });
  }

  async getById(id: string) {
    const resv = await this.prisma.reservation.findUnique({ where: { id } });
    if (!resv) throw new NotFoundException('Reserva no encontrada');
    return resv;
  }

  async getByBusinessId(reservationId: string) {
    const resv = await this.prisma.reservation.findUnique({ where: { reservationId } });
    if (!resv) throw new NotFoundException('Reserva no encontrada');
    return resv;
  }

  async listByClient(clientIdentifier: string) {
    // Buscar cliente por UUID o por clientId (CC-XXXXX)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientIdentifier);
    
    const client = await this.prisma.client.findFirst({
      where: isUUID 
        ? { id: clientIdentifier, isDeleted: false }
        : { clientId: clientIdentifier, isDeleted: false },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Incluir los bookings de hotel y vuelo relacionados
    return this.prisma.reservation.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      include: {
        hotelBookings: {
          select: {
            id: true,
            bookingId: true,
            propertyCode: true,
            roomTypeCode: true,
            checkIn: true,
            checkOut: true,
            totalAmount: true,
            currency: true,
            state: true,
            extBookingId: true,
          },
        },
        flightBookings: {
          select: {
            id: true,
            pnr: true,
            origin: true,
            destination: true,
            departureAt: true,
            returnAt: true,
            totalAmount: true,
            currency: true,
            state: true,
            extBookingId: true,
            segments: true,
          },
        },
      },
    });
  }

  async cancel(id: string, dto: CancelReservationDto) {
    const resv = await this.prisma.reservation.findUnique({ where: { id } });
    if (!resv) throw new NotFoundException('Reserva no encontrada');

    if (resv.state !== 'PENDIENTE') {
      throw new BadRequestException('Sólo reservas PENDIENTE pueden cancelarse');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { state: 'CANCELADA', note: dto.reason ?? resv.note },
    });
  }
}