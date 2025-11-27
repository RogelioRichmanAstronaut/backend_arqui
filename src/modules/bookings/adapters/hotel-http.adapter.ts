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

/**
 * Mapeo de CityID ISO 3166-2 a nombres de ciudad para el hotel
 */
const CITY_MAP: Record<string, string> = {
  'CO-BOG': 'Bogotá',
  'CO-MDE': 'Medellín',
  'CO-CLO': 'Cali',
  'CO-CTG': 'Cartagena',
  'CO-BAQ': 'Barranquilla',
  'CO-SMR': 'Santa Marta',
  'CO-PEI': 'Pereira',
  'CO-BGA': 'Bucaramanga',
};

const cityIdToName = (cityId: string): string => {
  return CITY_MAP[cityId] || cityId.split('-')[1] || cityId;
};

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

  /**
   * Búsqueda de habitaciones disponibles
   * GET /manejadordb/db/reservas/available-rooms (con body JSON)
   * 
   * NOTA: El hotel usa GET con body (no query params)
   * NOTA: Convierte CityID ISO 3166-2 (CO-MDE) a nombre (Medellín)
   * Respuesta: { consulta_id, hoteles: [...] }
   */
  async search(req: HotelSearchRequestDto): Promise<HotelSearchResponseDto> {
    const { data } = await this.http.request({
      method: 'GET',
      url: '/manejadordb/db/reservas/available-rooms',
      data: {
        ciudad_destino: cityIdToName(req.cityId),
        fecha_checkin: req.checkIn,
        fecha_checkout: req.checkOut,
        num_adultos: req.adults,
        num_habitaciones: req.rooms,
      },
    });
    
    // El hotel devuelve { consulta_id, hoteles: [...] }
    const hotel = data?.hoteles?.[0];
    return {
      queryId: data?.consulta_id,
      hotelId: hotel?.hotel_id,
      name: hotel?.nombre,
      cityId: hotel?.ciudad,
      stars: hotel?.categoria_estrellas,
      amenities: hotel?.servicios_hotel ?? [],
      photos: hotel?.fotos ?? [],
      roomTypes: (hotel?.habitaciones ?? []).map((t: any) => ({
        roomId: t?.habitacion_id,
        roomType: t?.tipo,
        roomCode: t?.codigo_tipo_habitacion,
        available: t?.disponible,
        priceTotal: Number(t?.precio),
        currency: 'COP',
        amenities: t?.servicios_habitacion ?? [],
      })),
    };
  }

  /**
   * Crear pre-reserva de habitación
   * POST /manejadordb/db/reservas
   * 
   * NOTA: El hotel devuelve un array: [{ id_reserva, precio_total, estado }]
   */
  async reserve(req: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    const { data } = await this.http.post('/manejadordb/db/reservas', {
      id_hotel: req.hotelId,
      codigo_tipo_habitacion: req.roomId,
      fecha_checkin: req.checkIn,
      fecha_checkout: req.checkOut,
      cedula_reserva: req.clientId,
      num_habitaciones: String(req.rooms || 1),
      num_adultos: String(req.adults || 1),
    });
    
    // El hotel devuelve un array
    const reservation = Array.isArray(data) ? data[0] : data;
    return {
      hotelReservationId: reservation?.id_reserva || reservation?.id_reserva_provisional,
      priceTotal: Number(reservation?.precio_total),
      currency: 'COP',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      initialState: reservation?.estado || 'PENDIENTE',
    };
  }

  /**
   * Confirmar reserva de hotel
   * PUT /manejadordb/db/reservas/deliberacion
   * 
   * NOTA: El hotel espera UUID para id_transaccion, pero Turismo usa formato banco (BDB-...)
   * Generamos un UUID determinístico basado en el transactionId del banco
   */
  async confirm(req: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    // Convertir transactionId de banco a UUID si no es UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.transactionId);
    const hotelTransactionId = isUUID 
      ? req.transactionId 
      : this.generateUUIDFromString(req.transactionId);
    
    const { data } = await this.http.put('/manejadordb/db/reservas/deliberacion', {
      id_reserva: req.hotelReservationId,
      id_transaccion: hotelTransactionId,
      estado: 'CONFIRMADO',
    });
    return {
      confirmedId: data?.id_reserva,
      finalState: String(data?.estado || data?.estado_final).toUpperCase() === 'CONFIRMADA' ? 'CONFIRMADA' : 'RECHAZADA',
      voucherCode: data?.codigo_voucher || data?.id_reserva,
      audit: data?.audit ?? undefined,
    };
  }

  /** Genera un UUID v4 aleatorio */
  private generateUUIDFromString(_str: string): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Cancelar reserva de hotel
   * PUT /manejadordb/db/reservas/cancelacion
   */
  async cancel(req: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    // Convertir reservationId a UUID si no es UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.reservationId);
    const hotelTransactionId = isUUID 
      ? req.reservationId 
      : this.generateUUIDFromString(req.reservationId);
    
    const { data } = await this.http.put('/manejadordb/db/reservas/cancelacion', {
      id_reserva: req.confirmedId,
      id_transaccion: hotelTransactionId,
      cedula_reserva: req.origin === 'CLIENTE' ? '1234567890' : req.origin,
      origen_solicitud: req.origin,
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