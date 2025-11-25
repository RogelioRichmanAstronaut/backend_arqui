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
      origen: req.originCityId,
      destino: req.destinationCityId,
      fechaSalida: req.departureAt ?? null,
      fechaRegreso: req.returnAt ?? null,
      numPasajeros: req.passengers,
      clase: req.cabin,
    });
    return {
      queryId: data?.consultaId,
      flights: (data?.vuelos ?? []).map((v: any) => ({
        flightId: v?.vueloId,
        airline: v?.aerolinea,
        originCityId: v?.origen,
        destinationCityId: v?.destino,
        departsAt: v?.fechaSalida,
        arrivesAt: v?.fechaLlegada,
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
      vueloId: req.flightId,
      numPasajeros: req.passengers.length,
      contactoReserva: req.passengers[0]?.name || 'Contacto',
      documentoContacto: req.clientId,
    });
    return {
      flightReservationId: data?.reservaVueloId,
      priceTotal: Number(data?.precioTotal),
      initialState: 'PENDIENTE',
      expiresAt: data?.fechaExpiracion,
    };
  }

  async confirm(req: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    const { data } = await this.http.post('/air/confirm', {
      reservaVueloId: req.flightReservationId,
      transaccionId: req.transactionId,
      precioTotalConfirmado: req.totalPrice || 0,
      estado: 'CONFIRMADO',
    });
    return {
      confirmedId: data?.confirmacionId,
      finalState: String(data?.estadoFinal || data?.estado).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      ticketCode: data?.codigoTiquete,
    };
  }

  async cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    const { data } = await this.http.post('/air/cancel', {
      confirmacionId: req.confirmedId,
      reservaGlobalId: req.reservationId,
      cedula: req.origin,
      origenSolicitud: 'CLIENTE',
      motivo: req.reason,
      observaciones: req.notes ?? '',
    });
    return {
      state: String(data?.resultado || data?.estado).toUpperCase() === 'APROBADO' ? 'SUCCESS' : 'ERROR',
      message: data?.mensaje ?? undefined,
      cancelledAt: data?.fechaCancelacion || data?.canceladoEn,
    };
  }
}