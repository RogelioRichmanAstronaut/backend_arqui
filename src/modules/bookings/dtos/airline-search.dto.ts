// bookings/dtos/airline-search.dto.ts
import { IsString, IsInt, Min, IsOptional, IsDateString } from 'class-validator';

export class AirlineSearchRequestDto {
  @IsString() origen!: string;    // ciudad o IATA
  @IsString() destino!: string;   // ciudad o IATA
  @IsOptional() @IsDateString() fecha_salida?: string;
  @IsOptional() @IsDateString() fecha_regreso?: string;
  @IsInt() @Min(1) num_pasajeros!: number;
  @IsString() clase!: 'ECONOMICA' | 'EJECUTIVA';
}

export class AirlineSearchResponseDto {
  @IsString() consulta_id!: string;
  vuelos!: Array<{
    vuelo_id: string;
    aerolinea: string;
    origen: string; destino: string;
    salida_hora: string; llegada_hora: string; // ISO-8601
    duracion: string;
    tarifa: string; condiciones: string[];
    precio: number; moneda: string;
    equipaje: string;
  }>;
}