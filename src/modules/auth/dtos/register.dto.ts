import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ToTrimmed } from '../../common/transformers';

export enum UserRoleDto {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @ToTrimmed() name!: string;
  @IsEnum(UserRoleDto) role!: UserRoleDto;
}

