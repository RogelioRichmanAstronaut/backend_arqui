import { IsUUID, IsIn, IsString } from 'class-validator';

export class AirlineCancelRequestDto {
  @IsUUID('4') confirmedId!: string;
  @IsUUID('4') reservationId!: string;
  @IsIn(['CLIENTE','TURISMO']) origin!: 'CLIENTE'|'TURISMO';
  @IsString() reason!: string;
  notes?: string;
}
export class AirlineCancelResponseDto {
  state!: 'SUCCESS'|'ERROR'; message?: string; cancelledAt!: string;
}