import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
export class AuditDto {
  @IsString() action!: string;           // CREATE | STATUS_CHANGE | CHECK_IN | ...
  @IsDateString() at!: string;           // ISO 8601
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsString() service?: string; // nombre del servicio emisor
}