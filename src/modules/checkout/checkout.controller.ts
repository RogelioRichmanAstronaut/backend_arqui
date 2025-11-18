import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutQuoteRequestDto, CheckoutQuoteResponseDto } from './dtos/checkout-quote.dto';
import { CheckoutConfirmRequestDto, CheckoutConfirmResponseDto } from './dtos/checkout-confirm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  @Post('quote')
  quote(@Body() dto: CheckoutQuoteRequestDto): Promise<CheckoutQuoteResponseDto> {
    return this.service.quote(dto);
  }

  @Post('confirm')
  confirm(
    @Body() dto: CheckoutConfirmRequestDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<CheckoutConfirmResponseDto> {
    return this.service.confirm(dto, idemKey);
  }
}