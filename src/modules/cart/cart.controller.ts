import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartAddItemDto } from './dtos/cart-add-item.dto';
import { CartViewResponseDto } from './dtos/cart-response.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Post('items')
  addItem(@Body() dto: CartAddItemDto): Promise<CartViewResponseDto> {
    return this.service.addItem(dto);
  }

  @Get()
  getCart(@Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    return this.service.getCart(clientId);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string, @Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    return this.service.removeItem(clientId, id);
  }

  @Delete()
  clear(@Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    return this.service.clear(clientId);
  }
}