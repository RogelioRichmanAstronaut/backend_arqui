/**
 * CityMapperService - Servicio centralizado de mapeo de ciudades
 * 
 * Convierte entre formatos según documentos de integración:
 * - Turismo usa: CO-BOG (formato gobernanza CityID basado en ISO 3166-2)
 * - Hotel espera: "Bogotá" o "BOG" (ciudad_destino)
 * - Aerolínea espera: "BOG" (código IATA)
 * 
 * Referencia: Documento de Gobernanza de Datos y Tentativa de Integraciones
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CityMapping {
  id: string;        // CO-BOG
  name: string;      // Bogotá
  iataCode: string | null;  // BOG
}

@Injectable()
export class CityMapperService implements OnModuleInit {
  // Cache en memoria para evitar consultas repetidas a DB
  private citiesById: Map<string, CityMapping> = new Map();
  private citiesByIata: Map<string, CityMapping> = new Map();
  private citiesByName: Map<string, CityMapping> = new Map();
  private initialized = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadCities();
  }

  /**
   * Carga todas las ciudades de la DB al cache
   */
  async loadCities(): Promise<void> {
    try {
      const cities = await this.prisma.cityAlias.findMany();
      
      for (const city of cities) {
        const mapping: CityMapping = {
          id: city.id,
          name: city.name,
          iataCode: city.iataCode,
        };
        
        this.citiesById.set(city.id.toUpperCase(), mapping);
        
        if (city.iataCode) {
          this.citiesByIata.set(city.iataCode.toUpperCase(), mapping);
        }
        
        this.citiesByName.set(city.name.toLowerCase(), mapping);
      }
      
      this.initialized = true;
      console.log(`✅ CityMapperService: ${cities.length} ciudades cargadas en cache`);
    } catch (error) {
      console.warn('⚠️ CityMapperService: No se pudieron cargar ciudades de DB, usando fallback');
      this.loadFallbackCities();
    }
  }

  /**
   * Fallback con ciudades principales si la DB no está disponible
   */
  private loadFallbackCities(): void {
    const fallback: CityMapping[] = [
      { id: 'CO-BOG', name: 'Bogotá', iataCode: 'BOG' },
      { id: 'CO-MDE', name: 'Medellín', iataCode: 'MDE' },
      { id: 'CO-CTG', name: 'Cartagena', iataCode: 'CTG' },
      { id: 'CO-CLO', name: 'Cali', iataCode: 'CLO' },
      { id: 'CO-BAQ', name: 'Barranquilla', iataCode: 'BAQ' },
      { id: 'CO-SMR', name: 'Santa Marta', iataCode: 'SMR' },
      { id: 'CO-PEI', name: 'Pereira', iataCode: 'PEI' },
      { id: 'CO-BGA', name: 'Bucaramanga', iataCode: 'BGA' },
      { id: 'US-MIA', name: 'Miami', iataCode: 'MIA' },
      { id: 'US-NYC', name: 'New York', iataCode: 'JFK' },
      { id: 'ES-MAD', name: 'Madrid', iataCode: 'MAD' },
      { id: 'MX-CUN', name: 'Cancún', iataCode: 'CUN' },
    ];
    
    for (const city of fallback) {
      this.citiesById.set(city.id.toUpperCase(), city);
      if (city.iataCode) {
        this.citiesByIata.set(city.iataCode.toUpperCase(), city);
      }
      this.citiesByName.set(city.name.toLowerCase(), city);
    }
    
    this.initialized = true;
  }

  // ============================================
  // MÉTODOS DE CONVERSIÓN
  // ============================================

  /**
   * Convierte CityID a nombre de ciudad
   * Para Hotel: ciudad_destino acepta "Bogotá" o "BOG"
   * 
   * @param cityId - CO-BOG
   * @returns "Bogotá"
   */
  cityIdToName(cityId: string): string {
    const city = this.citiesById.get(cityId.toUpperCase());
    if (city) return city.name;
    
    // Fallback: extraer parte después del guión
    const parts = cityId.split('-');
    return parts.length > 1 ? parts[1] : cityId;
  }

  /**
   * Convierte CityID a código IATA
   * Para Aerolínea: origen/destino acepta "BOG"
   * 
   * @param cityId - CO-BOG
   * @returns "BOG"
   */
  cityIdToIata(cityId: string): string {
    const city = this.citiesById.get(cityId.toUpperCase());
    if (city?.iataCode) return city.iataCode;
    
    // Fallback: extraer parte después del guión (asumiendo formato CO-BOG)
    const parts = cityId.split('-');
    return parts.length > 1 ? parts[1] : cityId;
  }

  /**
   * Convierte código IATA a CityID
   * 
   * @param iataCode - BOG
   * @returns "CO-BOG"
   */
  iataToCityId(iataCode: string): string {
    const city = this.citiesByIata.get(iataCode.toUpperCase());
    if (city) return city.id;
    
    // Fallback: asumir Colombia
    return `CO-${iataCode.toUpperCase()}`;
  }

  /**
   * Convierte nombre de ciudad a CityID
   * 
   * @param name - "Bogotá"
   * @returns "CO-BOG"
   */
  nameToCityId(name: string): string | null {
    const city = this.citiesByName.get(name.toLowerCase());
    return city?.id ?? null;
  }

  /**
   * Obtiene la ciudad completa por ID
   */
  getCityById(cityId: string): CityMapping | null {
    return this.citiesById.get(cityId.toUpperCase()) ?? null;
  }

  /**
   * Obtiene todas las ciudades
   */
  getAllCities(): CityMapping[] {
    return Array.from(this.citiesById.values());
  }

  /**
   * Verifica si un CityID es válido
   */
  isValidCityId(cityId: string): boolean {
    return this.citiesById.has(cityId.toUpperCase());
  }

  /**
   * Recarga el cache de ciudades
   */
  async reload(): Promise<void> {
    this.citiesById.clear();
    this.citiesByIata.clear();
    this.citiesByName.clear();
    await this.loadCities();
  }
}


