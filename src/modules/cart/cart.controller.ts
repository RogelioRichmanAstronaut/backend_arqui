import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartAddItemDto } from './dtos/cart-add-item.dto';
import { CartViewResponseDto } from './dtos/cart-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly service: CartService) {}

  @Post('items')
  addItem(@Body() dto: CartAddItemDto): Promise<CartViewResponseDto> {
    console.debug('Add item to cart attempt with DTO:', dto);
    return this.service.addItem(dto);
  }

  @Get()
  getCart(@Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    console.debug('Get cart attempt for clientId:', clientId);
    return this.service.getCart(clientId);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string, @Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    console.debug(`Remove item attempt for itemId: ${id} and clientId: ${clientId}`);
    return this.service.removeItem(clientId, id);
  }

  @Delete()
  clear(@Query('clientId') clientId: string): Promise<CartViewResponseDto> {
    console.debug('Clear cart attempt for clientId:', clientId);
    return this.service.clear(clientId);
  }
}