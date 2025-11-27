import { IsString, IsUrl, IsOptional } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';

// Opciones para permitir localhost en desarrollo
const urlOptions = { require_tld: false, require_protocol: true };

export class CheckoutConfirmRequestDto {
  @IsClientID() clientId!: string;
  @IsISO4217() currency!: string;
  @IsOptional() @IsString() cartId?: string; // Opcional si se usa clientId

  @IsString() description!: string;
  @IsUrl(urlOptions) returnUrl!: string;
  @IsUrl(urlOptions) callbackUrl!: string;
}

export class CheckoutConfirmResponseDto {
  reservationId!: string;
  orderId!: string;
  totalAmount!: number;
  currency!: string;
  paymentAttemptId!: string;
  bankPaymentUrl!: string;
  initialState!: 'PENDIENTE';
  expiresAt!: string;

  // Referencias de reservas creadas por tipo
  hotelReservations!: Array<{ hotelReservationId: string; expiresAt: string }>;
  flightReservations!: Array<{ flightReservationId: string; expiresAt: string }>;
}