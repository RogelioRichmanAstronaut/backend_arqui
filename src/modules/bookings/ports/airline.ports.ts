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
  
  export interface AirlinePort {
    search(req: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto>;
    reserve(req: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto>;
    confirm(req: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto>;
    cancel(req: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto>;
  }