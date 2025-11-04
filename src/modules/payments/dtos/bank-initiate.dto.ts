import { IsString, IsNumber, IsUrl, IsIn } from 'class-validator';

export class BankInitiatePaymentRequestDto {
  @IsString() identificador_paquete!: string;
  @IsNumber() monto_total!: number;
  @IsString() moneda!: string; // ISO-4217
  @IsString() descripcion!: string;
  @IsUrl() retorno_url!: string;
  @IsUrl() callback_url!: string;
  @IsString() identificador_cliente!: string;
}

export class BankInitiatePaymentResponseDto {
  @IsString() identificador_intento_pago!: string;
  @IsUrl() url_pago_banco!: string;
  @IsIn(['PENDIENTE']) estado_inicial!: 'PENDIENTE';
  @IsString() fecha_expiracion!: string; // ISO-8601
}