import { Injectable } from '@nestjs/common';
import { AirlineHttpAdapter } from './adapters/airline-http.adapter';
import { HotelHttpAdapter } from './adapters/hotel-http.adapter';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingState } from '@prisma/client';
import { MarginsService } from '../margins/margins.service';

// AIR DTOs
import { AirlineSearchRequestDto, AirlineSearchResponseDto } from './dtos/airline-search.dto';
import { AirlineReserveRequestDto, AirlineReserveResponseDto } from './dtos/airline-reserve.dto';
import { AirlineConfirmRequestDto, AirlineConfirmResponseDto } from './dtos/airline-confirm.dto';
import { AirlineCancelRequestDto, AirlineCancelResponseDto } from './dtos/airline-cancel.dto';

// HOTEL DTOs
import { HotelSearchRequestDto, HotelSearchResponseDto } from './dtos/hotel-search.dto';
import { HotelReserveRequestDto, HotelReserveResponseDto } from './dtos/hotel-reserve.dto';
import { HotelConfirmRequestDto, HotelConfirmResponseDto } from './dtos/hotel-confirm.dto';
import { HotelCancelRequestDto, HotelCancelResponseDto } from './dtos/hotel-cancel.dto';

@Injectable()
export class BookingsService {
  private readonly airline = new AirlineHttpAdapter();
  private readonly hotels = new HotelHttpAdapter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly margins: MarginsService,
  ) {}

  // -------- AIRLINE --------
  async airSearch(dto: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    const result = await this.airline.search(dto);
    
    // Aplicar margen de comisión (5% vuelos) a los precios mostrados al cliente
    if (result.flights) {
      result.flights = result.flights.map(flight => {
        const marginCalc = this.margins.applyMargin(flight.price, 'AIR');
        return {
          ...flight,
          basePrice: flight.price, // Precio original del proveedor
          price: marginCalc.final, // Precio con comisión para el cliente
        };
      });
    }
    
    return result;
  }
  airReserve(dto: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    return this.airline.reserve(dto);
  }
  airConfirm(dto: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    return this.airline.confirm(dto);
  }
  async airCancel(dto: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    const result = await this.airline.cancel(dto);
    
    // Actualizar estado local del FlightBooking
    try {
      await this.prisma.flightBooking.updateMany({
        where: { 
          OR: [
            { extBookingId: dto.confirmedId },
            { pnr: dto.confirmedId },
          ]
        },
        data: { state: BookingState.CANCELADA },
      });
      console.log(`[Bookings] FlightBooking ${dto.confirmedId} actualizado a CANCELADA`);
    } catch (err) {
      console.warn(`[Bookings] No se pudo actualizar FlightBooking local:`, err);
    }
    
    return result;
  }

  // -------- HOTELS --------
  async hotelsSearch(dto: HotelSearchRequestDto): Promise<HotelSearchResponseDto> {
    const result = await this.hotels.search(dto);
    
    // Aplicar margen de comisión (10% hoteles) a los precios mostrados al cliente
    if (result.roomTypes) {
      result.roomTypes = result.roomTypes.map(room => {
        const marginCalc = this.margins.applyMargin(room.priceTotal, 'HOTEL');
        return {
          ...room,
          basePriceTotal: room.priceTotal, // Precio original del proveedor
          priceTotal: marginCalc.final, // Precio con comisión para el cliente
        };
      });
    }
    
    return result;
  }
  hotelsReserve(dto: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    return this.hotels.reserve(dto);
  }
  hotelsConfirm(dto: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    return this.hotels.confirm(dto);
  }
  async hotelsCancel(dto: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    const result = await this.hotels.cancel(dto);
    
    // Actualizar estado local del HotelBooking
    try {
      await this.prisma.hotelBooking.updateMany({
        where: { 
          OR: [
            { extBookingId: dto.confirmedId },
            { bookingId: dto.confirmedId },
          ]
        },
        data: { state: BookingState.CANCELADA },
      });
      console.log(`[Bookings] HotelBooking ${dto.confirmedId} actualizado a CANCELADA`);
    } catch (err) {
      console.warn(`[Bookings] No se pudo actualizar HotelBooking local:`, err);
    }
    
    return result;
  }
}