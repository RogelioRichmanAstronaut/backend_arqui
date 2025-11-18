import { registerDecorator, ValidationOptions } from 'class-validator';

/** Código IATA de 3 letras (A-Z). */
export function IsIATACode(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsIATACode',
      target: object.constructor,
      propertyName,
      options: { message: '$property debe ser IATA (p.ej. BOG, MDE, JFK)', ...options },
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
        },
      },
    });
  };
}