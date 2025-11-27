import { IsUUID, IsDateString, IsInt, Min, IsOptional, IsString, MinLength } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';

export class HotelReserveRequestDto {
  /** ID del hotel (UUID) */
  @IsUUID('4') hotelId!: string;
  /** Código del tipo de habitación (ej: "doble", "suite") */
  @IsString() @MinLength(1) roomId!: string;
  @IsClientID() clientId!: string;
  @IsDateString() checkIn!: string;
  @IsDateString() checkOut!: string;
  /** Vínculo a la reserva global en Turismo (UUID) */
  @IsUUID('4') reservationId!: string;
  @IsOptional() @IsInt() @Min(1) rooms?: number;
  @IsOptional() @IsInt() @Min(1) adults?: number;
}

export class HotelReserveResponseDto {
  hotelReservationId!: string;       // HotelsReservations SoR del Hotel
  priceTotal!: number; currency!: string;
  expiresAt!: string; initialState: 'PENDIENTE' = 'PENDIENTE';
}