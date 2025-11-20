import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogService],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should return a non-empty list of cities', () => {
    const cities = service.findAllCities();
    expect(Array.isArray(cities)).toBeTruthy();
    expect(cities.length).toBeGreaterThan(0);
  });

  it('should validate known city id', () => {
    const cities = service.findAllCities();
    const id = cities[0].id;
    expect(service.validateCityId(id)).toBeTruthy();
    const notFound = service.findCityById('XX-XXX');
    expect(notFound).toBeUndefined();
  });
});
