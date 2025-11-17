import { IsNumber, Min, IsUUID } from 'class-validator';
import { IsISO4217 } from '../../common/validation/decorators/is-iso4217';
import { ToNumber } from '../../common/transformers';

export class CreateReservationDto {
  @IsUUID('4')
  clientUuid!: string; // PK de Client (no el clientId de negocio)

  @IsISO4217()
  currency!: string;

  @ToNumber() @IsNumber() @Min(0)
  totalAmount!: number;

  // opcionales pensados a futuro: paqueteId, notas, etc.
  note?: string;
}