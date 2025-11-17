import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ToTrimmed } from '../../common/transformers';

export class UpdateClientDto {
  @IsOptional() @IsString() @ToTrimmed()
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @ToTrimmed()
  phone?: string;
}