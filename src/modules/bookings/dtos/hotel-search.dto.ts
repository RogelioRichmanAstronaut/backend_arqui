import { IsDateString, IsInt, Min, IsOptional } from 'class-validator';
import { IsCityID } from '../../common/validation/decorators/is-city-id';

export class HotelSearchRequestDto {
  @IsOptional()                                  // ciudad_destino es OPCIONAL según docs.txt
  @IsCityID() cityId?: string;                   // CO-BOG (opcional)
  @IsDateString() checkIn!: string;              // ISO 8601
  @IsDateString() checkOut!: string;             // ISO 8601
  @IsInt() @Min(1) adults!: number;
  @IsInt() @Min(1) rooms!: number;
}

export class HotelSearchResponseDto {
  queryId?: string;
  hotelId!: string;
  name!: string;
  cityId!: string;
  stars?: number;
  amenities!: string[];
  photos?: string[];
  roomTypes!: Array<{
    roomId?: string;
    roomType: string;
    roomCode?: string;
    available?: boolean;
    priceTotal: number;
    currency: string;
    amenities?: string[];
  }>;
}