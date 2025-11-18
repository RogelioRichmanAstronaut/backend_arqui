import { IsEnum, IsInt, Min, IsNumber, IsString, IsOptional } from 'class-validator';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';

export enum CartItemKindDto { HOTEL='HOTEL', AIR='AIR' }

export class CartAddItemDto {
  @IsString() clientId!: string;                // CC-xxxx (no obligatorio el decorador IsClientID aquí; se valida en checkout)
  @IsISO4217() currency!: string;

  @IsEnum(CartItemKindDto) kind!: CartItemKindDto;
  @IsString() refId!: string;                   // flightId / roomId compuesto

  @IsInt() @Min(1) quantity!: number;
  @IsNumber() price!: number;

  // HOTEL: { hotelId, roomId, checkIn, checkOut }
  // AIR:   { flightId, passengers: [{name,doc}], originCityId, destinationCityId, departureAt? }
  @IsOptional() metadata?: Record<string, any>;
}