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
import { cityIdToIata, iataToCityId } from '../../catalog/city-utils';
import { setupAxiosLogger } from '../../../common/utils/axios-logger';

/**
 * Adapter HTTP para el servicio de Aerolínea
 * 
 * Endpoints reales (IP: 10.43.103.34:8080):
 * - POST /v1/vuelos/buscar
 * - POST /v1/vuelos/reservar
 * - PUT  /v1/vuelos/reservas/{reservaVueloId}/confirmar
 * - DELETE /v1/vuelos/reservas/{reservaVueloId}
 * 
 * NOTA: La aerolínea usa códigos IATA (BOG, MDE) mientras que
 * Turismo usa ISO 3166-2 (CO-BOG, CO-MDE). Este adapter hace la conversión.
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
    
    // Add debug logging for all requests/responses
    setupAxiosLogger(this.http, 'AIRLINE');
  }

  /**
   * Búsqueda de vuelos
   * POST /v1/vuelos/buscar
   * 
   * Convierte CityID ISO 3166-2 a código IATA antes de enviar
   * 
   * NOTA: La aerolínea devuelve 404 si no hay vuelos, no es un error real
   */
  async search(req: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    try {
      const { data } = await this.http.post('/v1/vuelos/buscar', {
        origen: cityIdToIata(req.originCityId),
        destino: cityIdToIata(req.destinationCityId),
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
          // Convertir códigos IATA a CityID ISO 3166-2 para consistencia en Turismo
          originCityId: iataToCityId(v?.origen),
          destinationCityId: iataToCityId(v?.destino),
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
    } catch (error: any) {
      // 404 = No hay vuelos disponibles (no es un error real)
      if (error.response?.status === 404) {
        return {
          queryId: error.response?.data?.consultaId ?? 'no-flights',
          flights: [],
        };
      }
      // Otros errores sí los propagamos
      throw error;
    }
  }

  /**
   * Reserva de vuelo (pre-reserva)
   * POST /v1/vuelos/reservar
   */
  async reserve(req: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    const passengers = req.passengers ?? [];
    const { data } = await this.http.post('/v1/vuelos/reservar', {
      vueloId: req.flightId,
      numPasajeros: passengers.length || 1,
      contactoReserva: passengers[0]?.name || req.clientId || 'Contacto',
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
   * 
   * NOTA: La aerolínea devuelve texto plano, no JSON
   * - 200: "Pre-reserva cancelada exitosamente"
   * - 409: "No se puede cancelar: La reserva ya está cancelada o expirada"
   */
  async cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    try {
      const response = await this.http.delete(
        `/v1/vuelos/reservas/${req.confirmedId}`
      );
      // La aerolínea devuelve texto plano en caso de éxito
      const message = typeof response.data === 'string' 
        ? response.data 
        : response.data?.mensaje ?? 'Cancelación procesada';
      
      return {
        state: 'SUCCESS',
        message,
        cancelledAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // Error 409 u otro - la reserva ya estaba cancelada o expirada
      const errorMessage = error.response?.data ?? error.message ?? 'Error en cancelación';
      return {
        state: 'ERROR',
        message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        cancelledAt: new Date().toISOString(),
      };
    }
  }
}