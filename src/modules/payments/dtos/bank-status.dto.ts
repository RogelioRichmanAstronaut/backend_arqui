// payments/dtos/bank-status.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class BankStatusRequestDto {
  @IsOptional() @IsString() identificador_intento_pago?: string;
  @IsOptional() @IsString() identificador_transaccion_banco?: string;
}

export class BankStatusResponseDto {
  @IsString() estado_actual!: string;
  @IsString() detalle_estado!: string;
  @IsString() monto_total!: string;
  @IsString() moneda!: string;
  @IsString() codigo_autorizacion!: string;
  @IsString() comprobante_url_o_hash!: string;
  @IsString() fecha_ultimo_cambio!: string; // ISO-8601
}