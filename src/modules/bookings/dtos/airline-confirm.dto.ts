import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';

export class AirlineConfirmRequestDto {
  /** ID de reserva de la aerolínea (formato: RSV... o UUID) */
  @IsString() @MinLength(1) flightReservationId!: string;
  @IsTransactionID() transactionId!: string;
  @IsOptional() @IsNumber() totalPrice?: number;
}

export class AirlineConfirmResponseDto {
  confirmedId!: string; finalState!: 'CONFIRMADA' | 'RECHAZADA'; ticketCode!: string;
}