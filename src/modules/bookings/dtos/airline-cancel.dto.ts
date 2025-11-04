// bookings/dtos/airline-cancel.dto.ts
import { IsString, IsIn } from 'class-validator';

export class AirlineCancelRequestDto {
  @IsString() reserva_confirmada_id!: string;
  @IsString() id_transaccion!: string;
  @IsString() cedula_reserva!: string;
  @IsIn(['CLIENTE', 'TURISMO']) origen_solicitud!: 'CLIENTE' | 'TURISMO';
  @IsString() motivo!: string;         // reembolso, error cobro, no show, etc.
  observaciones?: string;
}

export class AirlineCancelResponseDto {
  @IsIn(['SUCCESS', 'ERROR']) estado!: 'SUCCESS' | 'ERROR';
  mensaje?: string;
  @IsString() reservaConfirmadaId!: string;
  @IsString() fechaCancelacion!: string; // ISO-8601
  politicaAplicada?: string;
}