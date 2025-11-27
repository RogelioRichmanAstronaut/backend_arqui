import { IsUUID, IsString, IsUrl, IsNumber, IsOptional } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';

// Opciones para permitir localhost en desarrollo
const urlOptions = { require_tld: false, require_protocol: true };

export class BankInitiatePaymentRequestDto {
  @IsUUID('4') reservationId!: string;     // referenciar la orden global (UUID PK)
  @IsClientID() clientId!: string;         // <tipoDoc>-<numero>
  @IsOptional() @IsString() clientName?: string; // Nombre del cliente
  @IsNumber() totalAmount!: number;
  @IsISO4217() currency!: string;          // ISO-4217
  @IsString() description!: string;
  @IsUrl(urlOptions) returnUrl!: string;   // Permite localhost
  @IsUrl(urlOptions) callbackUrl!: string; // Permite localhost
}

export class BankInitiatePaymentResponseDto {
  @IsString() paymentAttemptId!: string;   // id interno del banco (no global)
  @IsString() bankPaymentUrl!: string;     // URL del banco (puede ser localhost)
  @IsString() initialState!: 'PENDIENTE';
  @IsString() expiresAt!: string;          // ISO 8601
}