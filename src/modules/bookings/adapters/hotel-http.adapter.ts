import axios, { AxiosInstance } from 'axios';
import { hotelConfig } from '../services/hotel.config';
import { HotelPort } from '../ports/hotel.ports';
import {
  HotelSearchRequestDto, HotelSearchResponseDto,
} from '../dtos/hotel-search.dto';
import {
  HotelReserveRequestDto, HotelReserveResponseDto,
} from '../dtos/hotel-reserve.dto';
import {
  HotelConfirmRequestDto, HotelConfirmResponseDto,
} from '../dtos/hotel-confirm.dto';
import {
  HotelCancelRequestDto, HotelCancelResponseDto,
} from '../dtos/hotel-cancel.dto';

export class HotelHttpAdapter implements HotelPort {
  private http: AxiosInstance;
  private cfg = hotelConfig();

  constructor() {
    this.http = axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: this.cfg.timeoutMs,
      headers: { 'x-api-key': this.cfg.apiKey },
    });
  }

  async search(req: HotelSearchRequestDto): Promise<HotelSearchResponseDto> {
    const { data } = await this.http.get('/manejadordb/db/reservas/available-rooms', {
      params: {
        ciudad_destino: req.cityId,
        fecha_checkin: req.checkIn,
        fecha_checkout: req.checkOut,
        num_adultos: req.adults,
        num_habitaciones: req.rooms,
      },
    });
    return {
      hotelId: data?.hotel_id,
      name: data?.nombre,
      cityId: data?.ciudad,
      amenities: data?.servicios_hotel ?? [],
      roomTypes: (data?.habitaciones ?? []).map((t: any) => ({
        roomType: t?.tipo,
        priceTotal: Number(t?.precio),
        currency: 'COP',
      })),
    };
  }

  async reserve(req: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    const { data } = await this.http.post('/manejadordb/db/reservas', {
      id_hotel: req.hotelId,
      codigo_tipo_habitacion: req.roomId,
      fecha_checkin: req.checkIn,
      fecha_checkout: req.checkOut,
      cedula_reserva: req.clientId,
      num_habitaciones: req.rooms || 1,
      num_adultos: req.adults || 1,
    });
    return {
      hotelReservationId: data?.id_reserva || data?.id_reserva_provisional,
      priceTotal: Number(data?.precio_total),
      currency: 'COP',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      initialState: 'PENDIENTE',
    };
  }

  async confirm(req: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    const { data } = await this.http.put('/manejadordb/db/reservas/deliberacion', {
      id_reserva: req.hotelReservationId,
      id_transaccion: req.transactionId,
      estado: 'CONFIRMADO',
    });
    return {
      confirmedId: data?.id_reserva,
      finalState: String(data?.estado || data?.estado_final).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      voucherCode: data?.codigo_voucher || data?.id_reserva,
      audit: data?.audit ?? undefined,
    };
  }

  async cancel(req: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    const { data } = await this.http.put('/manejadordb/db/reservas/cancelacion', {
      id_reserva: req.confirmedId,
      id_transaccion: req.reservationId,
      cedula_reserva: req.origin,
      origen_solicitud: 'CLIENTE',
      motivo: req.reason,
      observaciones: req.notes ?? '',
    });
    return {
      state: String(data?.estado || data?.estado_inicial).toUpperCase() === 'APROBADO' ? 'SUCCESS' : 'ERROR',
      message: data?.observaciones ?? undefined,
      cancelledAt: data?.fecha_registro || new Date().toISOString(),
    };
  }
}