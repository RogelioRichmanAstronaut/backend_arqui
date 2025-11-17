import { IsNumber } from 'class-validator';
import { IsTransactionID } from '../../common/validation/decorators/is-transaction-id';

export class BankValidateReceiptRequestDto {
  @IsTransactionID() transactionId!: string;
  @IsNumber() expectedAmount!: number;
}
export class BankValidateReceiptResponseDto { valid!: 'SI'|'NO'; detail!: string; }