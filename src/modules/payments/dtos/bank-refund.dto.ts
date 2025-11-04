// payments/dtos/bank-refund.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class BankRefundRequestDto {
  @IsString() identificador_transaccion_banco!: string;
  @IsNumber() monto_reembolso!: number;
}

export class BankRefundResponseDto {
  @IsString() identificador_reembolso!: string;
  @IsString() estado_reembolso!: string;
  @IsString() comprobante_url_o_hash!: string;
  @IsString() fecha_reembolso!: string; // ISO-8601
}