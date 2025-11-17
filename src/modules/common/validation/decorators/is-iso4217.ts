import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Obtiene el conjunto de monedas ISO-4217 desde Intl.supportedValuesOf('currency') si está disponible.
 * Si no, usa un fallback interno suficientemente amplio.
 */
function buildISO4217Set(): Set<string> {
  try {
    const anyIntl = Intl as any;
    if (typeof anyIntl?.supportedValuesOf === 'function') {
      const list: string[] = anyIntl.supportedValuesOf('currency');
      if (Array.isArray(list) && list.length > 0) {
        return new Set(list.map((c) => c.toUpperCase()));
      }
    }
  } catch {
    // continúa al fallback
  }

  // Fallback (conjunto amplio de códigos ISO-4217 comunes y oficiales; en mayúsculas)
  // Fuente base: ISO 4217 (lista resumida y práctica para producción; incluye principales divisas).
  const fallback = [
    'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN',
    'BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD',
    'CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK',
    'DJF','DKK','DOP','DZD',
    'EGP','ERN','ETB','EUR',
    'FJD','FKP',
    'GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD',
    'HKD','HNL','HRK','HTG','HUF',
    'IDR','ILS','INR','IQD','IRR','ISK',
    'JMD','JOD','JPY',
    'KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT',
    'LAK','LBP','LKR','LRD','LSL','LYD',
    'MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN',
    'NAD','NGN','NIO','NOK','NPR','NZD',
    'OMR',
    'PAB','PEN','PGK','PHP','PKR','PLN','PYG',
    'QAR',
    'RON','RSD','RUB','RWF',
    'SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SLL','SOS','SRD','SSP','STN','SYP','SZL',
    'THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS',
    'UAH','UGX','USD','UYU','UZS',
    'VES','VND','VUV',
    'WST',
    'XAF','XCD','XOF','XPF',
    'YER',
    'ZAR','ZMW','ZWL'
  ];
  return new Set(fallback);
}

/** Set global de monedas válidas (mayúsculas) */
export const ISO4217_SET: Set<string> = buildISO4217Set();

/** Helper reutilizable (útil en servicios/pipes/tests) */
export function isISO4217String(
  value: unknown,
  opts?: { strict?: boolean; allowLowercase?: boolean }
): boolean {
  if (typeof value !== 'string') return false;
  const allowLowercase = !!opts?.allowLowercase;
  const strict = opts?.strict !== false; // por defecto estricto
  const code = allowLowercase ? value.toUpperCase() : value;

  if (!/^[A-Z]{3}$/.test(code)) return false;
  if (!strict) return true;
  return ISO4217_SET.has(code);
}

type DecoratorOpts = ValidationOptions & { strict?: boolean; allowLowercase?: boolean };

/**
 * Decorador de validación para códigos de moneda ISO-4217 (alfabéticos de 3 letras).
 * - strict (default: true): además del formato, verifica pertenencia al set ISO.
 * - allowLowercase (default: false): permite minúsculas normalizando a mayúsculas para validar.
 *
 * Ejemplos válidos: USD, EUR, COP, JPY.
 */
export function IsISO4217(options?: DecoratorOpts) {
  const strict = options?.strict !== false;
  const allowLowercase = !!options?.allowLowercase;

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsISO4217',
      target: object.constructor,
      propertyName,
      constraints: [strict, allowLowercase],
      options: {
        message: '$property debe ser una moneda ISO-4217 válida (p.ej., USD, EUR, COP)',
        ...options
      },
      validator: {
        validate(value: any, args?: ValidationArguments) {
          const [cStrict, cAllowLower] = (args?.constraints ?? [strict, allowLowercase]) as [
            boolean,
            boolean
          ];
          return isISO4217String(value, { strict: cStrict, allowLowercase: cAllowLower });
        }
      }
    });
  };
}