import { IsEmail, IsOptional, IsString } from 'class-validator';
import { IsClientID } from '../../common/validation/decorators/is-client-id';
import { ToTrimmed } from '../../common/transformers';

export class CreateClientDto {
  @IsClientID()
  clientId!: string; // <TIPO>-<NUMERO>

  @IsString() @ToTrimmed()
  name!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @ToTrimmed()
  phone?: string;
}