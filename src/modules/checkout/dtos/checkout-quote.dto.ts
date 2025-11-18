import { IsOptional, IsString } from 'class-validator';

export class CheckoutQuoteRequestDto {
  @IsString() clientId!: string;
  @IsOptional() @IsString() cartId?: string;
}
export class CheckoutQuoteItemDto {
  kind!: 'HOTEL'|'AIR';
  refId!: string;
  price!: number;
  currency!: string;
  quantity!: number;
  metadata!: Record<string, any>;
}
export class CheckoutQuoteResponseDto {
  currency!: string;
  total!: number;
  items!: CheckoutQuoteItemDto[];
}