// payments/dtos/bank-validate-receipt.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class BankValidateReceiptRequestDto {
  @IsString() identificador_transaccion_banco!: string;
  @IsNumber() monto_reembolso!: number;
}

export class BankValidateReceiptResponseDto {
  @IsString() valido!: 'SI' | 'NO';
  @IsString() detalle_validacion!: string;
}