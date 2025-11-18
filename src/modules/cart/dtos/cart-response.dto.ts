export class CartItemViewDto {
    id!: string;
    kind!: 'HOTEL'|'AIR';
    refId!: string;
    quantity!: number;
    price!: number;
    currency!: string;
    metadata!: Record<string, any>;
  }
  
  export class CartViewResponseDto {
    id!: string;
    clientId!: string;
    currency!: string;
    total!: number;
    items!: CartItemViewDto[];
  }