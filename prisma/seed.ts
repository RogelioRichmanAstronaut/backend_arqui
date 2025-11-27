/**
 * Prisma Seed Script - Catálogo de Ciudades
 * 
 * Según Documento de Gobernanza de Datos:
 * - CityID: basado en ISO 3166-2 (ej.: CO-BOG)
 * 
 * Según Documento de Integración:
 * - Hotel: ciudad_destino acepta "Bogotá" o "BOG"
 * - Aerolínea: origen/destino acepta "BOG" (IATA)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ciudades según documentos oficiales
const CITIES = [
  // Colombia - Principales ciudades
  { id: 'CO-BOG', name: 'Bogotá', iataCode: 'BOG' },
  { id: 'CO-MDE', name: 'Medellín', iataCode: 'MDE' },
  { id: 'CO-CTG', name: 'Cartagena', iataCode: 'CTG' },
  { id: 'CO-CLO', name: 'Cali', iataCode: 'CLO' },
  { id: 'CO-BAQ', name: 'Barranquilla', iataCode: 'BAQ' },
  { id: 'CO-SMR', name: 'Santa Marta', iataCode: 'SMR' },
  { id: 'CO-PEI', name: 'Pereira', iataCode: 'PEI' },
  { id: 'CO-BGA', name: 'Bucaramanga', iataCode: 'BGA' },
  { id: 'CO-CUC', name: 'Cúcuta', iataCode: 'CUC' },
  { id: 'CO-ADZ', name: 'San Andrés', iataCode: 'ADZ' },
  { id: 'CO-LET', name: 'Leticia', iataCode: 'LET' },
  { id: 'CO-VVC', name: 'Villavicencio', iataCode: 'VVC' },
  { id: 'CO-MZL', name: 'Manizales', iataCode: 'MZL' },
  { id: 'CO-AXM', name: 'Armenia', iataCode: 'AXM' },
  { id: 'CO-NVA', name: 'Neiva', iataCode: 'NVA' },
  { id: 'CO-IBE', name: 'Ibagué', iataCode: 'IBE' },
  { id: 'CO-PSO', name: 'Pasto', iataCode: 'PSO' },
  { id: 'CO-MTR', name: 'Montería', iataCode: 'MTR' },
  
  // USA - Principales ciudades
  { id: 'US-MIA', name: 'Miami', iataCode: 'MIA' },
  { id: 'US-NYC', name: 'New York', iataCode: 'JFK' },
  { id: 'US-LAX', name: 'Los Angeles', iataCode: 'LAX' },
  { id: 'US-ORD', name: 'Chicago', iataCode: 'ORD' },
  { id: 'US-DFW', name: 'Dallas', iataCode: 'DFW' },
  { id: 'US-ATL', name: 'Atlanta', iataCode: 'ATL' },
  
  // España
  { id: 'ES-MAD', name: 'Madrid', iataCode: 'MAD' },
  { id: 'ES-BCN', name: 'Barcelona', iataCode: 'BCN' },
  
  // México
  { id: 'MX-MEX', name: 'Ciudad de México', iataCode: 'MEX' },
  { id: 'MX-CUN', name: 'Cancún', iataCode: 'CUN' },
  { id: 'MX-GDL', name: 'Guadalajara', iataCode: 'GDL' },
  
  // Brasil
  { id: 'BR-SAO', name: 'São Paulo', iataCode: 'GRU' },
  { id: 'BR-RIO', name: 'Rio de Janeiro', iataCode: 'GIG' },
  
  // Argentina
  { id: 'AR-BUE', name: 'Buenos Aires', iataCode: 'EZE' },
  
  // Perú
  { id: 'PE-LIM', name: 'Lima', iataCode: 'LIM' },
  
  // Chile
  { id: 'CL-SCL', name: 'Santiago', iataCode: 'SCL' },
  
  // Panamá
  { id: 'PA-PTY', name: 'Ciudad de Panamá', iataCode: 'PTY' },
];

async function main() {
  console.log('🌱 Cargando catálogo de ciudades según documentos oficiales...\n');
  
  for (const city of CITIES) {
    await prisma.cityAlias.upsert({
      where: { id: city.id },
      update: { name: city.name, iataCode: city.iataCode },
      create: city,
    });
  }
  
  console.log(`✅ ${CITIES.length} ciudades cargadas`);
  console.log('\nFormato CityID: basado en ISO 3166-2 (ej.: CO-BOG)');
  console.log('- name: para Hotel (ciudad_destino)');
  console.log('- iataCode: para Aerolínea (origen/destino)');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
