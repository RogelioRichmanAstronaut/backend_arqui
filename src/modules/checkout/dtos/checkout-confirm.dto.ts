import { IsString, IsUrl } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';

export class CheckoutConfirmRequestDto {
  @IsClientID() clientId!: string;
  @IsISO4217() currency!: string;
  @IsString() cartId!: string;

  @IsString() description!: string;
  @IsUrl() returnUrl!: string;
  @IsUrl() callbackUrl!: string;
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