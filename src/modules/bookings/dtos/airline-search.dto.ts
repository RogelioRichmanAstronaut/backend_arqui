import { IsInt, Min, IsOptional, IsDateString, IsIn } from 'class-validator';
import { IsCityID } from '../../common/validation/decorators/is-city-id';

export class AirlineSearchRequestDto {
  @IsCityID() originCityId!: string;    // CO-BOG
  @IsCityID() destinationCityId!: string;
  @IsOptional() @IsDateString() departureAt?: string;
  @IsOptional() @IsDateString() returnAt?: string;
  @IsInt() @Min(1) passengers!: number;
  @IsIn(['ECONOMICA','EJECUTIVA']) cabin!: 'ECONOMICA'|'EJECUTIVA';
}

export class AirlineSearchResponseDto {
  queryId!: string;
  flights!: Array<{
    flightId: string; // UUID v4
    airline: string; originCityId: string; destinationCityId: string;
    departsAt: string; arrivesAt: string; duration: string;
    fare: string; rules: string[]; price: number; currency: string; baggage: string;
  }>;
}