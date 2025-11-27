import { Controller, Get } from '@nestjs/common';
import { MarginsService } from './margins.service';

@Controller('margins')
export class MarginsController {
  constructor(private readonly service: MarginsService) {}

  @Get('rates')
  getRates() {
    console.debug('Get margins rates attempt');
    return {
      hotel: this.service.getMarginPercentage('HOTEL'),
      air: this.service.getMarginPercentage('AIR'),
    };
  }
}

