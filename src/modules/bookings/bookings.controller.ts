import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';

// AIRLINE DTOs
import { AirlineSearchRequestDto, AirlineSearchResponseDto } from './dtos/airline-search.dto';
import { AirlineReserveRequestDto, AirlineReserveResponseDto } from './dtos/airline-reserve.dto';
import { AirlineConfirmRequestDto, AirlineConfirmResponseDto } from './dtos/airline-confirm.dto';
import { AirlineCancelRequestDto, AirlineCancelResponseDto } from './dtos/airline-cancel.dto';

// HOTEL DTOs
import { HotelSearchRequestDto, HotelSearchResponseDto } from './dtos/hotel-search.dto';
import { HotelReserveRequestDto, HotelReserveResponseDto } from './dtos/hotel-reserve.dto';
import { HotelConfirmRequestDto, HotelConfirmResponseDto } from './dtos/hotel-confirm.dto';
import { HotelCancelRequestDto, HotelCancelResponseDto } from './dtos/hotel-cancel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  // AIR
  @Post('air/search')
  airSearch(@Body() dto: AirlineSearchRequestDto): Promise<AirlineSearchResponseDto> {
    return this.service.airSearch(dto);
  }

  @Post('air/reserve')
  airReserve(@Body() dto: AirlineReserveRequestDto): Promise<AirlineReserveResponseDto> {
    return this.service.airReserve(dto);
  }

  @Post('air/confirm')
  airConfirm(@Body() dto: AirlineConfirmRequestDto): Promise<AirlineConfirmResponseDto> {
    return this.service.airConfirm(dto);
  }

  @Post('air/cancel')
  airCancel(@Body() dto: AirlineCancelRequestDto): Promise<AirlineCancelResponseDto> {
    return this.service.airCancel(dto);
  }

  // HOTELS
  @Post('hotels/search')
  hotelsSearch(@Body() dto: HotelSearchRequestDto): Promise<HotelSearchResponseDto> {
    return this.service.hotelsSearch(dto);
  }

  @Post('hotels/reserve')
  hotelsReserve(@Body() dto: HotelReserveRequestDto): Promise<HotelReserveResponseDto> {
    return this.service.hotelsReserve(dto);
  }

  @Post('hotels/confirm')
  hotelsConfirm(@Body() dto: HotelConfirmRequestDto): Promise<HotelConfirmResponseDto> {
    return this.service.hotelsConfirm(dto);
  }

  @Post('hotels/cancel')
  hotelsCancel(@Body() dto: HotelCancelRequestDto): Promise<HotelCancelResponseDto> {
    return this.service.hotelsCancel(dto);
  }
}