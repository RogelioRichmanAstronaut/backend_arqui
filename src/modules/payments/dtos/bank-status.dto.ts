import { IsOptional, IsString } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';
import { StateID } from '../../common/enums/state-id.enum';

export class BankStatusRequestDto {
  @IsTransactionID() transactionId!: string;          // obligatorio según política
  @IsOptional() @IsString() paymentAttemptId?: string;// opcional (compatibilidad)
}

export class BankStatusResponseDto {
  state!: StateID;
  stateDetail!: string;
  totalAmount!: number;
  currency!: string;
  authCode!: string;
  receiptRef!: string;
  lastUpdateAt!: string; // ISO 8601
}