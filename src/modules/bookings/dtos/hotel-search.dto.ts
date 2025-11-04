// bookings/dtos/hotel-search.dto.ts
import { IsString, IsDateString, IsInt, Min } from 'class-validator';

export class HotelSearchRequestDto {
  @IsString() ciudad_destino!: string;
  @IsDateString() fecha_entrada!: string;
  @IsDateString() fecha_salida!: string;
  @IsInt() @Min(1) numero_adultos!: number;
  @IsInt() @Min(1) numero_habitaciones!: number;
}

export class HotelSearchResponseDto {
  cadena_id!: string;
  hotel_id!: string;
  nombre!: string;
  ciudad!: string;
  calificacion!: number;
  servicios!: string[];
  tipos_habitacion!: Array<{ codigo_tarifa: string; tipo: string; precio_total: number; moneda: string }>;
}