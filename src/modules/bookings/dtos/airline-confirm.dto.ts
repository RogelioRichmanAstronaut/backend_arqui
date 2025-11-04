// bookings/dtos/airline-confirm.dto.ts
import { IsString, IsIn } from 'class-validator';

export class AirlineConfirmRequestDto {
  @IsString() reserva_vuelo_id!: string;
  @IsString() transaccion_bancaria_id!: string;
}

export class AirlineConfirmResponseDto {
  @IsString() reserva_confirmada_id!: string;
  @IsIn(['CONFIRMADA', 'RECHAZADA']) estado_final!: 'CONFIRMADA' | 'RECHAZADA';
  @IsString() codigo_comprobante!: string;
}

