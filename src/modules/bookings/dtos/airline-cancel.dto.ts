import { IsIn, IsString, MinLength, IsOptional } from 'class-validator';

export class AirlineCancelRequestDto {
  /** ID de reserva confirmada (formato RSV... de aerolínea) */
  @IsString() @MinLength(1) confirmedId!: string;
  /** ID de reserva en Turismo */
  @IsString() @MinLength(1) reservationId!: string;
  @IsIn(['CLIENTE','TURISMO']) origin!: 'CLIENTE'|'TURISMO';
  @IsString() reason!: string;
  @IsOptional() @IsString() notes?: string;
}
export class AirlineCancelResponseDto {
  state!: 'SUCCESS'|'ERROR'; message?: string; cancelledAt!: string;
}