import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  BankInitiatePaymentRequestDto,
  BankInitiatePaymentResponseDto,
} from './dtos/bank-initiate.dto';
import {
  BankPaymentNotificationDto,
  BankAckResponseDto,
} from './dtos/bank-notify.dto';
import {
  BankStatusRequestDto,
  BankStatusResponseDto,
} from './dtos/bank-status.dto';
import {
  BankRefundRequestDto,
  BankRefundResponseDto,
} from './dtos/bank-refund.dto';
import {
  BankValidateReceiptRequestDto,
  BankValidateReceiptResponseDto,
} from './dtos/bank-validate-receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('init')
  @UseGuards(JwtAuthGuard)
  async initiate(
    @Body() dto: BankInitiatePaymentRequestDto,
    @Headers('Idempotency-Key') idemKey?: string,
  ): Promise<BankInitiatePaymentResponseDto> {
    return this.service.initiate(dto, idemKey);
  }

  @Post('webhook')
  async webhook(
    @Body() dto: BankPaymentNotificationDto,
    @Req() req: any,
  ): Promise<BankAckResponseDto> {
    // Si configuraste rawBody en bootstrap, úsalo; si no, el service hará fallback a JSON.stringify(dto)
    const rawBody: string | undefined = req?.rawBody;
    return this.service.handleNotification(dto, rawBody);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@Query() q: BankStatusRequestDto): Promise<BankStatusResponseDto> {
    return this.service.status(q);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refund(@Body() dto: BankRefundRequestDto): Promise<BankRefundResponseDto> {
    return this.service.refund(dto);
  }

  @Post('receipt/validate')
  @UseGuards(JwtAuthGuard)
  async validateReceipt(
    @Body() dto: BankValidateReceiptRequestDto,
  ): Promise<BankValidateReceiptResponseDto> {
    return this.service.validateReceipt(dto);
  }
}