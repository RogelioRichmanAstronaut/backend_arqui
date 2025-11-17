import { IsOptional, IsString } from 'class-validator';
import { ToTrimmed } from '../../common/transformers';

export class CancelReservationDto {
  @IsOptional() @IsString() @ToTrimmed()
  reason?: string;
}