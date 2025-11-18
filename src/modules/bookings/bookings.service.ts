import { Injectable } from '@nestjs/common';
import { AirlineHttpAdapter } from './adapters/airline-http.adapter';
import { HotelHttpAdapter } from './adapters/hotel-http.adapter';

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
  // Si usas puertos, tipa como AirlinePort/HotelPort
  private readonly airline = new AirlineHttpAdapter();
  private readonly hotels = new HotelHttpAdapter();

  // -------- AIRLINE --------
  airSearch(dto: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    return this.airline.search(dto);
  }
  airReserve(dto: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    return this.airline.reserve(dto);
  }
  airConfirm(dto: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    return this.airline.confirm(dto);
  }
  airCancel(dto: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    return this.airline.cancel(dto);
  }

  // -------- HOTELS --------
  hotelsSearch(dto: HotelSearchRequestDto): Promise<HotelSearchResponseDto> {
    return this.hotels.search(dto);
  }
  hotelsReserve(dto: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    return this.hotels.reserve(dto);
  }
  hotelsConfirm(dto: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    return this.hotels.confirm(dto);
  }
  hotelsCancel(dto: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    return this.hotels.cancel(dto);
  }
}