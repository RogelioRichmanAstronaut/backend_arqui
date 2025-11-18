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
    const { data } = await this.http.post('/hotels/search', {
      ciudad: req.cityId,
      entrada: req.checkIn,
      salida: req.checkOut,
      adultos: req.adults,
      habitaciones: req.rooms,
    });
    return {
      hotelId: data?.hotel_id,
      name: data?.nombre,
      cityId: data?.ciudad,
      amenities: data?.amenidades ?? [],
      roomTypes: (data?.tipos_habitacion ?? []).map((t: any) => ({
        roomType: t?.tipo,
        priceTotal: Number(t?.precio_total),
        currency: t?.moneda,
      })),
    };
  }

  async reserve(req: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    const { data } = await this.http.post('/hotels/reserve', {
      hotel_id: req.hotelId,
      room_id: req.roomId,
      cliente_id: req.clientId,
      entrada: req.checkIn,
      salida: req.checkOut,
      reserva_global_id: req.reservationId,
    });
    return {
      hotelReservationId: data?.reserva_hotel_id,
      priceTotal: Number(data?.precio_total),
      currency: data?.moneda,
      expiresAt: data?.expira_en,
      initialState: 'PENDIENTE',
    };
  }

  async confirm(req: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    const { data } = await this.http.post('/hotels/confirm', {
      reserva_hotel_id: req.hotelReservationId,
      transaccion_id: req.transactionId,
    });
    return {
      confirmedId: data?.confirmacion_id,
      finalState: String(data?.estado_final).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      voucherCode: data?.codigo_voucher,
      audit: data?.audit ?? undefined,
    };
  }

  async cancel(req: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    const { data } = await this.http.post('/hotels/cancel', {
      confirmacion_id: req.confirmedId,
      reserva_global_id: req.reservationId,
      origen: req.origin,
      motivo: req.reason,
      notas: req.notes ?? null,
    });
    return {
      state: String(data?.resultado ?? 'SUCCESS').toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      message: data?.mensaje ?? undefined,
      cancelledAt: data?.cancelado_en,
    };
  }
}