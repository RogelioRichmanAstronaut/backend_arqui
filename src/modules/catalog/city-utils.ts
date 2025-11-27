/**
 * city-utils.ts - Utilidades estáticas de mapeo de ciudades
 * 
 * Para uso en adapters que no usan inyección de dependencias de NestJS.
 * Contiene un mapeo completo de CityID → nombre y CityID → IATA.
 * 
 * Referencia: Documento de Gobernanza de Datos
 * - CityID: basado en ISO 3166-2 (ej.: CO-BOG)
 * - Hotel: ciudad_destino acepta "Bogotá" o "BOG"
 * - Aerolínea: origen/destino acepta código IATA "BOG"
 */

// ============================================
// MAPEO COMPLETO DE CIUDADES
// ============================================

interface CityData {
  name: string;
  iataCode: string;
}

/**
 * Mapeo de CityID a datos de ciudad
 * Formato: CO-BOG → { name: 'Bogotá', iataCode: 'BOG' }
 */
export const CITY_DATABASE: Record<string, CityData> = {
  // Colombia - Principales ciudades
  'CO-BOG': { name: 'Bogotá', iataCode: 'BOG' },
  'CO-MDE': { name: 'Medellín', iataCode: 'MDE' },
  'CO-CTG': { name: 'Cartagena', iataCode: 'CTG' },
  'CO-CLO': { name: 'Cali', iataCode: 'CLO' },
  'CO-BAQ': { name: 'Barranquilla', iataCode: 'BAQ' },
  'CO-SMR': { name: 'Santa Marta', iataCode: 'SMR' },
  'CO-PEI': { name: 'Pereira', iataCode: 'PEI' },
  'CO-BGA': { name: 'Bucaramanga', iataCode: 'BGA' },
  'CO-CUC': { name: 'Cúcuta', iataCode: 'CUC' },
  'CO-ADZ': { name: 'San Andrés', iataCode: 'ADZ' },
  'CO-LET': { name: 'Leticia', iataCode: 'LET' },
  'CO-VVC': { name: 'Villavicencio', iataCode: 'VVC' },
  'CO-MZL': { name: 'Manizales', iataCode: 'MZL' },
  'CO-AXM': { name: 'Armenia', iataCode: 'AXM' },
  'CO-NVA': { name: 'Neiva', iataCode: 'NVA' },
  'CO-IBE': { name: 'Ibagué', iataCode: 'IBE' },
  'CO-PSO': { name: 'Pasto', iataCode: 'PSO' },
  'CO-MTR': { name: 'Montería', iataCode: 'MTR' },
  
  // USA - Principales ciudades
  'US-MIA': { name: 'Miami', iataCode: 'MIA' },
  'US-NYC': { name: 'New York', iataCode: 'JFK' },
  'US-LAX': { name: 'Los Angeles', iataCode: 'LAX' },
  'US-ORD': { name: 'Chicago', iataCode: 'ORD' },
  'US-DFW': { name: 'Dallas', iataCode: 'DFW' },
  'US-ATL': { name: 'Atlanta', iataCode: 'ATL' },
  
  // España
  'ES-MAD': { name: 'Madrid', iataCode: 'MAD' },
  'ES-BCN': { name: 'Barcelona', iataCode: 'BCN' },
  
  // México
  'MX-MEX': { name: 'Ciudad de México', iataCode: 'MEX' },
  'MX-CUN': { name: 'Cancún', iataCode: 'CUN' },
  'MX-GDL': { name: 'Guadalajara', iataCode: 'GDL' },
  
  // Brasil
  'BR-SAO': { name: 'São Paulo', iataCode: 'GRU' },
  'BR-RIO': { name: 'Rio de Janeiro', iataCode: 'GIG' },
  
  // Argentina
  'AR-BUE': { name: 'Buenos Aires', iataCode: 'EZE' },
  
  // Perú
  'PE-LIM': { name: 'Lima', iataCode: 'LIM' },
  
  // Chile
  'CL-SCL': { name: 'Santiago', iataCode: 'SCL' },
  
  // Panamá
  'PA-PTY': { name: 'Ciudad de Panamá', iataCode: 'PTY' },
};

// Mapeo inverso: IATA → CityID
const IATA_TO_CITY_ID: Record<string, string> = {};
for (const [cityId, data] of Object.entries(CITY_DATABASE)) {
  if (data.iataCode) {
    IATA_TO_CITY_ID[data.iataCode.toUpperCase()] = cityId;
  }
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

/**
 * Convierte CityID a nombre de ciudad
 * Para Hotel: ciudad_destino acepta "Bogotá"
 * 
 * @param cityId - CO-BOG
 * @returns "Bogotá"
 */
export function cityIdToName(cityId: string): string {
  if (!cityId) return cityId;
  const city = CITY_DATABASE[cityId.toUpperCase()];
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
export function cityIdToIata(cityId: string): string {
  if (!cityId) return cityId;
  const city = CITY_DATABASE[cityId.toUpperCase()];
  if (city?.iataCode) return city.iataCode;
  
  // Fallback: extraer parte después del guión (asumiendo formato CO-BOG)
  const parts = cityId.split('-');
  return parts.length > 1 ? parts[1] : cityId;
}

/**
 * Convierte código IATA a CityID
 * 
 * @param iataCode - BOG
 * @param defaultCountry - País por defecto (CO)
 * @returns "CO-BOG"
 */
export function iataToCityId(iataCode: string, defaultCountry = 'CO'): string {
  if (!iataCode) return iataCode;
  
  // Si ya tiene guión, asumir que es CityID
  if (iataCode.includes('-')) return iataCode.toUpperCase();
  
  const cityId = IATA_TO_CITY_ID[iataCode.toUpperCase()];
  if (cityId) return cityId;
  
  // Fallback: construir con país por defecto
  return `${defaultCountry}-${iataCode.toUpperCase()}`;
}

/**
 * Verifica si un CityID es válido
 */
export function isValidCityId(cityId: string): boolean {
  return cityId?.toUpperCase() in CITY_DATABASE;
}

/**
 * Obtiene todos los CityIDs disponibles
 */
export function getAllCityIds(): string[] {
  return Object.keys(CITY_DATABASE);
}

