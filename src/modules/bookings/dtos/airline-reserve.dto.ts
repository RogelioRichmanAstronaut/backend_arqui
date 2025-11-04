// bookings/dtos/airline-reserve.dto.ts
import { IsString, IsInt, Min } from 'class-validator';

export class AirlineReserveRequestDto {
  @IsString() vuelo_id!: string;
  @IsInt() @Min(1) num_pasajeros!: number;
  @IsString() contacto_reserva!: string;
  @IsString() documento_contacto!: string;
}

export class AirlineReserveResponseDto {
  @IsString() reserva_vuelo_id!: string;
  precio_total!: number;
  estado_inicial!: 'PENDIENTE';
  fecha_expiracion!: string; // ISO-8601
  observaciones?: string;
}