import { IsUUID, IsDateString, IsInt, Min, IsOptional } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';

export class HotelReserveRequestDto {
  @IsUUID('4') hotelId!: string;
  @IsUUID('4') roomId!: string;
  @IsClientID() clientId!: string;
  @IsDateString() checkIn!: string;
  @IsDateString() checkOut!: string;
  @IsUUID('4') reservationId!: string; // vínculo a la reserva global
  @IsOptional() @IsInt() @Min(1) rooms?: number;
  @IsOptional() @IsInt() @Min(1) adults?: number;
}

export class HotelReserveResponseDto {
  hotelReservationId!: string;       // HotelsReservations SoR del Hotel
  priceTotal!: number; currency!: string;
  expiresAt!: string; initialState: 'PENDIENTE' = 'PENDIENTE';
}