import { IsNumber } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';
import type { StateID } from '../../common/enums/state-id.enum';

export class BankRefundRequestDto {
  @IsTransactionID() transactionId!: string;
  @IsNumber() refundAmount!: number;
}
export class BankRefundResponseDto {
  refundId!: string; 
  refundState!: StateID; 
  receiptRef!: string; 
  refundedAt!: string;
}