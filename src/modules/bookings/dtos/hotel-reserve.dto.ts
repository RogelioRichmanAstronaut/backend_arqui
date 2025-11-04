// bookings/dtos/hotel-reserve.dto.ts
import { IsString, IsDateString, IsInt, Min } from 'class-validator';

export class HotelReserveRequestDto {
  @IsString() hotel_id!: string;
  @IsString() tipo_habitacion!: string;
  @IsDateString() fecha_entrada!: string;
  @IsDateString() fecha_salida!: string;
  @IsString() huesped_principal!: string; // datos del huésped principal
}

export class HotelReserveResponseDto {
  @IsString() reserva_provisional_id!: string;
  precio_total!: number;
  moneda!: string;
  @IsDateString() fecha_expiracion!: string;
  estado_inicial!: 'PENDIENTE';
}