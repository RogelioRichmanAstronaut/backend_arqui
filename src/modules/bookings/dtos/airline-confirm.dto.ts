import { IsUUID, IsNumber, IsOptional } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';

export class AirlineConfirmRequestDto {
  @IsUUID('4') flightReservationId!: string;
  @IsTransactionID() transactionId!: string;
  @IsOptional() @IsNumber() totalPrice?: number;
}

export class AirlineConfirmResponseDto {
  confirmedId!: string; finalState!: 'CONFIRMADA' | 'RECHAZADA'; ticketCode!: string;
}