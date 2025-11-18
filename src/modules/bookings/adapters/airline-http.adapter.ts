import axios, { AxiosInstance } from 'axios';
import { airlineConfig } from '../services/airline.config';
import { AirlinePort } from '../ports/airline.ports';
import {
  AirlineSearchRequestDto, AirlineSearchResponseDto,
} from '../dtos/airline-search.dto';
import {
  AirlineReserveRequestDto, AirlineReserveResponseDto,
} from '../dtos/airline-reserve.dto';
import {
  AirlineConfirmRequestDto, AirlineConfirmResponseDto,
} from '../dtos/airline-confirm.dto';
import {
  AirlineCancelRequestDto, AirlineCancelResponseDto,
} from '../dtos/airline-cancel.dto';

export class AirlineHttpAdapter implements AirlinePort {
  private http: AxiosInstance;
  private cfg = airlineConfig();

  constructor() {
    this.http = axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: this.cfg.timeoutMs,
      headers: { 'x-api-key': this.cfg.apiKey },
    });
  }

  async search(req: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    const { data } = await this.http.post('/air/search', {
      origen_ciudad: req.originCityId,
      destino_ciudad: req.destinationCityId,
      salida: req.departureAt ?? null,
      regreso: req.returnAt ?? null,
      pasajeros: req.passengers,
      cabina: req.cabin,
    });
    // Normalización → respetar DTO
    return {
      queryId: data?.consulta_id,
      flights: (data?.vuelos ?? []).map((v: any) => ({
        flightId: v?.vuelo_id,
        airline: v?.aerolinea,
        originCityId: v?.origen_ciudad,
        destinationCityId: v?.destino_ciudad,
        departsAt: v?.sale,
        arrivesAt: v?.llega,
        duration: v?.duracion,
        fare: v?.tarifa,
        rules: v?.reglas ?? [],
        price: Number(v?.precio),
        currency: v?.moneda,
        baggage: v?.equipaje,
      })),
    };
  }

  async reserve(req: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    const { data } = await this.http.post('/air/reserve', {
      vuelo_id: req.flightId,
      reserva_global_id: req.reservationId,
      cliente_id: req.clientId,
      pasajeros: req.passengers,
    });
    return {
      flightReservationId: data?.reserva_vuelo_id,
      priceTotal: Number(data?.precio_total),
      initialState: 'PENDIENTE',
      expiresAt: data?.expira_en,
    };
  }

  async confirm(req: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    const { data } = await this.http.post('/air/confirm', {
      reserva_vuelo_id: req.flightReservationId,
      transaccion_id: req.transactionId,
    });
    return {
      confirmedId: data?.confirmacion_id,
      finalState: String(data?.estado_final).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      ticketCode: data?.codigo_tiquete,
    };
  }

  async cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    const { data } = await this.http.post('/air/cancel', {
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