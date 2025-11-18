import { Injectable } from '@nestjs/common';
import { MarginEntity } from './entities/margin.entity';

@Injectable()
export class MarginsService {
  // Regla de negocio: 10% Hoteles, 5% Vuelos
  private readonly HOTEL_MARGIN = 0.10;
  private readonly AIR_MARGIN = 0.05;

  applyMargin(basePrice: number, kind: 'HOTEL' | 'AIR'): MarginEntity {
    const percentage = kind === 'HOTEL' ? this.HOTEL_MARGIN : this.AIR_MARGIN;
    const marginValue = Number((basePrice * percentage).toFixed(2));
    const finalPrice = Number((basePrice + marginValue).toFixed(2));
    
    return new MarginEntity(basePrice, marginValue, finalPrice);
  }

  getMarginPercentage(kind: 'HOTEL' | 'AIR'): number {
    return kind === 'HOTEL' ? this.HOTEL_MARGIN : this.AIR_MARGIN;
  }
}

