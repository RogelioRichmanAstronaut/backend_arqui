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
  
  export interface HotelPort {
    search(req: HotelSearchRequestDto): Promise<HotelSearchResponseDto>;
    reserve(req: HotelReserveRequestDto): Promise<HotelReserveResponseDto>;
    confirm(req: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto>;
    cancel(req: HotelCancelRequestDto): Promise<HotelCancelResponseDto>;
  }