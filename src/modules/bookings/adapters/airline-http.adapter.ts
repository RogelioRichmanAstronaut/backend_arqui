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
    const { data } = await this.http.post('/aerolinea/buscarVuelos', {
      origen: req.originCityId,
      destino: req.destinationCityId,
      fechaSalida: req.departureAt ?? null,
      fechaRegreso: req.returnAt ?? null,
      numPasajeros: req.passengers,
      clase: req.cabin,
    });
    return {
      queryId: data?.consulta_id,
      flights: (data?.vuelos ?? []).map((v: any) => ({
        flightId: v?.Flight_id,
        airline: v?.aerolinea,
        originCityId: v?.origen,
        destinationCityId: v?.destino,
        departsAt: v?.fecha_salida,
        arrivesAt: v?.fecha_llegada,
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
    const { data } = await this.http.post('/aerolinea/reservarVuelo', {
      vueloId: req.flightId,
      numPasajeros: req.passengers.length,
      contactoReserva: req.passengers[0]?.name || 'Contacto',
      documentoContacto: req.clientId,
    });
    return {
      flightReservationId: data?.reservation_id || data?.reserva_vuelo_id,
      priceTotal: Number(data?.precio_total),
      initialState: 'PENDIENTE',
      expiresAt: data?.fecha_expiracion,
    };
  }

  async confirm(req: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    const { data } = await this.http.post('/aerolinea/confirmarReserva', {
      reservaVueloId: req.flightReservationId,
      transaccionId: req.transactionId,
      precioTotalConfirmado: req.totalPrice || 0,
      estado: 'CONFIRMADO',
    });
    return {
      confirmedId: data?.confirmacion_id,
      finalState: String(data?.estado_final || data?.estado).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      ticketCode: data?.codigo_tiquete,
    };
  }

  async cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    const { data } = await this.http.post('/aerolinea/cancelarReserva', {
      id_reserva: req.confirmedId,
      id_transaccion: req.reservationId,
      cedula_reserva: req.origin,
      origen_solicitud: 'CLIENTE',
      motivo: req.reason,
      observaciones: req.notes ?? '',
    });
    return {
      state: String(data?.resultado || data?.estado).toUpperCase() === 'APROBADO' ? 'SUCCESS' : 'ERROR',
      message: data?.mensaje ?? undefined,
      cancelledAt: data?.fecha_cancelacion || data?.cancelado_en,
    };
  }
}