import { IsUUID, IsDateString } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';

export class HotelReserveRequestDto {
  @IsUUID('4') hotelId!: string;
  @IsUUID('4') roomId!: string;
  @IsClientID() clientId!: string;
  @IsDateString() checkIn!: string;
  @IsDateString() checkOut!: string;
  @IsUUID('4') reservationId!: string; // vínculo a la reserva global
}

export class HotelReserveResponseDto {
  hotelReservationId!: string;       // HotelsReservations SoR del Hotel
  priceTotal!: number; currency!: string;
  expiresAt!: string; initialState: 'PENDIENTE' = 'PENDIENTE';
}