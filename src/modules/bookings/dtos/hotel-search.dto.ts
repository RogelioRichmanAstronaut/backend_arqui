import { IsDateString, IsInt, Min } from 'class-validator';
import { IsCityID } from '../../common/validation/decorators/is-city-id';

export class HotelSearchRequestDto {
  @IsCityID() cityId!: string;                  // CO-BOG
  @IsDateString() checkIn!: string;             // ISO 8601
  @IsDateString() checkOut!: string;            // ISO 8601
  @IsInt() @Min(1) adults!: number;
  @IsInt() @Min(1) rooms!: number;
}

export class HotelSearchResponseDto {
  hotelId!: string; name!: string; cityId!: string;
  amenities!: string[];
  roomTypes!: Array<{ roomType: string; priceTotal: number; currency: string }>;
}