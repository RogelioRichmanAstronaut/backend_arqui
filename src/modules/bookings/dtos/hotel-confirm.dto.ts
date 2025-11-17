import { IsUUID } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';

export class HotelConfirmRequestDto {
  @IsUUID('4') hotelReservationId!: string;
  @IsTransactionID() transactionId!: string;
}

export class HotelConfirmResponseDto {
  confirmedId!: string; finalState!: 'CONFIRMADA' | 'RECHAZADA'; voucherCode!: string;
  audit?: import('../../common/dtos/audit.dto').AuditDto;
}