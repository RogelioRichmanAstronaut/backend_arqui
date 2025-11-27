/**
 * CatalogService - Servicio de catálogo de ciudades
 * 
 * Lee las ciudades desde la base de datos (CityAlias) a través de CityMapperService.
 * Mantiene compatibilidad con la entidad CityEntity para el resto del sistema.
 * 
 * Referencia: Documento de Gobernanza de Datos
 * - Cities — Owner: Estandar; SoR: Catálogo de destinos
 */

import { Injectable } from '@nestjs/common';
import { CityEntity } from './entities/city.entity';
import { CityMapperService } from './city-mapper.service';

@Injectable()
export class CatalogService {
  constructor(private readonly cityMapper: CityMapperService) {}

  /**
   * Obtiene todas las ciudades del catálogo
   */
  findAllCities(): CityEntity[] {
    const cities = this.cityMapper.getAllCities();
    return cities.map(c => new CityEntity(
      c.id,
      c.name,
      this.extractCountryFromId(c.id),
    ));
  }

  /**
   * Valida si un CityID existe en el catálogo
   */
  validateCityId(cityId: string): boolean {
    return this.cityMapper.isValidCityId(cityId);
  }

  /**
   * Busca una ciudad por su ID
   */
  findCityById(cityId: string): CityEntity | undefined {
    const city = this.cityMapper.getCityById(cityId);
    if (!city) return undefined;
    
    return new CityEntity(
      city.id,
      city.name,
      this.extractCountryFromId(city.id),
    );
  }

  /**
   * Extrae el país del CityID (CO-BOG -> Colombia)
   */
  private extractCountryFromId(cityId: string): string {
    const countryCode = cityId.split('-')[0];
    const countryNames: Record<string, string> = {
      'CO': 'Colombia',
      'US': 'USA',
      'ES': 'España',
      'MX': 'México',
      'BR': 'Brasil',
      'AR': 'Argentina',
      'PE': 'Perú',
      'CL': 'Chile',
      'PA': 'Panamá',
    };
    return countryNames[countryCode] || countryCode;
  }
}
