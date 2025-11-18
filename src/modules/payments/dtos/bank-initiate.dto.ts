import { IsUUID, IsString, IsUrl, IsNumber } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';

export class BankInitiatePaymentRequestDto {
  @IsUUID('4') reservationId!: string;     // referenciar la orden global
  @IsClientID() clientId!: string;         // <tipoDoc>-<numero>
  @IsNumber() totalAmount!: number;
  @IsISO4217() currency!: string;          // ISO-4217
  @IsString() description!: string;
  @IsUrl() returnUrl!: string;
  @IsUrl() callbackUrl!: string;
}

export class BankInitiatePaymentResponseDto {
  @IsString() paymentAttemptId!: string;   // id interno del banco (no global)
  @IsUrl() bankPaymentUrl!: string;
  @IsString() initialState!: 'PENDIENTE';
  @IsString() expiresAt!: string;          // ISO 8601
}