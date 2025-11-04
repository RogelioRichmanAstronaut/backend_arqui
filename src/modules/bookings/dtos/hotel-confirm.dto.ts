// bookings/dtos/hotel-confirm.dto.ts
import { IsString, IsIn } from 'class-validator';

export class HotelConfirmRequestDto {
  @IsString() reserva_provisional_id!: string;
  @IsString() transaccion_bancaria_id!: string;
}

export class HotelConfirmResponseDto {
  @IsString() reserva_confirmada_id!: string;
  @IsIn(['CONFIRMADA', 'RECHAZADA']) estado_final!: 'CONFIRMADA' | 'RECHAZADA';
  @IsString() codigo_comprobante!: string;
}