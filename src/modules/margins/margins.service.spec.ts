import { Test, TestingModule } from '@nestjs/testing';
import { MarginsService } from './margins.service';

describe('MarginsService', () => {
  let service: MarginsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarginsService],
    }).compile();

    service = module.get<MarginsService>(MarginsService);
  });

  it('should apply hotel margin 10% correctly', () => {
    const result = service.applyMargin(100, 'HOTEL');
    expect(result.base).toBe(100);
    expect(result.margin).toBe(10);
    expect(result.final).toBe(110);
  });

  it('should get margin percentage for HOTEL and AIR', () => {
    expect(service.getMarginPercentage('HOTEL')).toBeCloseTo(0.10);
    expect(service.getMarginPercentage('AIR')).toBeCloseTo(0.05);
  });
});
