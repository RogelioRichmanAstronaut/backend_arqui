import { IsUUID } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';

export class AirlineConfirmRequestDto {
  @IsUUID('4') flightReservationId!: string;
  @IsTransactionID() transactionId!: string;
}

export class AirlineConfirmResponseDto {
  confirmedId!: string; finalState!: 'CONFIRMADA' | 'RECHAZADA'; ticketCode!: string;
}