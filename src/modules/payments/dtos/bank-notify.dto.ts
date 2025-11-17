import { IsDateString, IsNumber, IsString } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';
import type { StateID } from '../../common/enums/state-id.enum';

export class BankPaymentNotificationDto {
  @IsTransactionID() transactionId!: string;     // global
  @IsString() paymentAttemptId!: string;         // del banco
  @IsClientID() clientId!: string;
  @IsNumber() totalAmount!: number;
  @IsISO4217() currency!: string;
  @IsString() authCode!: string;
  @IsString() receiptRef!: string;               // url/hash
  @IsDateString() transactionAt!: string;        // ISO 8601
  @IsString() signature!: string;
  @IsString() state!: StateID;                   // PENDIENTE/APROBADA/DENEGADA/CANCELADA
}

export class BankAckResponseDto { recibido: 'OK' = 'OK'; ackId!: string; }