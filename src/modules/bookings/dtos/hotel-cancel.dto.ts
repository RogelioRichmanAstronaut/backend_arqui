import { IsUUID, IsIn, IsString, IsOptional } from 'class-validator';

export class HotelCancelRequestDto {
  @IsUUID('4') confirmedId!: string;     // id de confirmación del hotel
  @IsUUID('4') reservationId!: string;   // vínculo a la reserva global
  @IsIn(['CLIENTE','TURISMO']) origin!: 'CLIENTE'|'TURISMO';
  @IsString() reason!: string;
  @IsOptional() @IsString() notes?: string;
}

export class HotelCancelResponseDto {
  state!: 'SUCCESS'|'ERROR';
  message?: string;
  cancelledAt!: string; // ISO 8601
}

