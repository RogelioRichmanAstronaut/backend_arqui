import { IsUUID } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';

export class AirlineReserveRequestDto {
  @IsUUID('4') flightId!: string;
  @IsUUID('4') reservationId!: string;
  @IsClientID() clientId!: string;
  passengers!: Array<{ name: string; doc: string }>;
}

export class AirlineReserveResponseDto {
  flightReservationId!: string;
  priceTotal!: number; initialState: 'PENDIENTE' = 'PENDIENTE';
  expiresAt!: string;
}