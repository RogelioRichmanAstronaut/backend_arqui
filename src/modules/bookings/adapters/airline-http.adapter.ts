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

/**
 * Adapter HTTP para el servicio de Aerolínea
 * 
 * Endpoints reales (IP: 10.43.103.34:8080):
 * - POST /v1/vuelos/buscar
 * - POST /v1/vuelos/reservar
 * - PUT  /v1/vuelos/reservas/{reservaVueloId}/confirmar
 * - DELETE /v1/vuelos/reservas/{reservaVueloId}
 */
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

  /**
   * Búsqueda de vuelos
   * POST /v1/vuelos/buscar
   */
  async search(req: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    const { data } = await this.http.post('/v1/vuelos/buscar', {
      origen: req.originCityId,
      destino: req.destinationCityId,
      fechaSalida: req.departureAt ?? null,
      fechaRegreso: req.returnAt ?? null,
      numPasajeros: req.passengers,
      clase: req.cabin,
    });
    return {
      queryId: data?.consultaId ?? data?.consulta_id,
      flights: (data?.vuelos ?? []).map((v: any) => ({
        flightId: v?.vueloId ?? v?.Flight_id ?? v?.id,
        airline: v?.aerolinea,
        originCityId: v?.origen,
        destinationCityId: v?.destino,
        departsAt: v?.fechaSalida ?? v?.fecha_salida,
        arrivesAt: v?.fechaLlegada ?? v?.fecha_llegada,
        duration: v?.duracion,
        fare: v?.tarifa ?? v?.clase,
        rules: v?.reglas ?? [],
        price: Number(v?.precio),
        currency: v?.moneda ?? 'COP',
        baggage: v?.equipaje,
      })),
    };
  }

  /**
   * Reserva de vuelo (pre-reserva)
   * POST /v1/vuelos/reservar
   */
  async reserve(req: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    const { data } = await this.http.post('/v1/vuelos/reservar', {
      vueloId: req.flightId,
      numPasajeros: req.passengers.length,
      contactoReserva: req.passengers[0]?.name || 'Contacto',
      documentoContacto: req.clientId,
    });
    return {
      flightReservationId: data?.reservaVueloId ?? data?.reservation_id ?? data?.id,
      priceTotal: Number(data?.precioTotal ?? data?.precio_total),
      initialState: 'PENDIENTE',
      expiresAt: data?.fechaExpiracion ?? data?.fecha_expiracion ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Confirmación de reserva (después del pago bancario)
   * PUT /v1/vuelos/reservas/{reservaVueloId}/confirmar
   */
  async confirm(req: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    const { data } = await this.http.put(
      `/v1/vuelos/reservas/${req.flightReservationId}/confirmar`,
      {
        transaccionBancariaId: req.transactionId,
        metodoPago: 'TARJETA_CREDITO',
      }
    );
    return {
      confirmedId: data?.reservaConfirmadaId ?? data?.confirmacion_id ?? req.flightReservationId,
      finalState: String(data?.estadoFinal ?? data?.estado_final ?? data?.estado).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      ticketCode: data?.codigoTiquete ?? data?.codigo_tiquete ?? data?.pnr ?? '',
    };
  }

  /**
   * Cancelación de reserva
   * DELETE /v1/vuelos/reservas/{reservaVueloId}
   */
  async cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    const { data } = await this.http.delete(
      `/v1/vuelos/reservas/${req.confirmedId}`
    );
    return {
      state: String(data?.estado ?? data?.resultado).toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      message: data?.mensaje ?? undefined,
      cancelledAt: data?.fechaCancelacion ?? data?.fecha_cancelacion ?? new Date().toISOString(),
    };
  }
}