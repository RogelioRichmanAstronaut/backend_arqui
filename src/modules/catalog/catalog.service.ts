import { Injectable } from '@nestjs/common';
import { CityEntity } from './entities/city.entity';

@Injectable()
export class CatalogService {
  // Fuente de verdad en memoria (simulando DB maestra)
  private readonly cities: CityEntity[] = [
    new CityEntity('CO-BOG', 'Bogotá', 'Colombia'),
    new CityEntity('CO-MDE', 'Medellín', 'Colombia'),
    new CityEntity('CO-CTG', 'Cartagena', 'Colombia'),
    new CityEntity('FR-PAR', 'París', 'Francia'),
    new CityEntity('JP-TYO', 'Tokio', 'Japón'),
    new CityEntity('CO-CLO', 'Cali', 'Colombia'),
    new CityEntity('US-MIA', 'Miami', 'USA'),
    new CityEntity('US-NYC', 'New York', 'USA'),
    new CityEntity('US-LAX', 'Los Angeles', 'USA'),
    new CityEntity('ES-MAD', 'Madrid', 'España'),
    new CityEntity('ES-BCN', 'Barcelona', 'España'),
    new CityEntity('MX-MEX', 'Ciudad de México', 'México'),
    new CityEntity('MX-CUN', 'Cancún', 'México'),
    new CityEntity('BR-SAO', 'São Paulo', 'Brasil'),
    new CityEntity('BR-RIO', 'Rio de Janeiro', 'Brasil'),
  ];

  findAllCities(): CityEntity[] {
    return this.cities;
  }

  validateCityId(cityId: string): boolean {
    return this.cities.some((c) => c.id === cityId);
  }

  findCityById(cityId: string): CityEntity | undefined {
    return this.cities.find((c) => c.id === cityId);
  }
}

