import { registerDecorator, ValidationOptions } from 'class-validator';
export function IsCityID(opts?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    registerDecorator({
      name: 'IsCityID',
      target: target.constructor,
      propertyName,
      options: { message: '$property debe ser CityID ISO 3166-2 (p.ej. CO-BOG)', ...opts },
      validator: { validate: (v: any) => typeof v === 'string' && /^[A-Z]{2}-[A-Z0-9]{3,}$/.test(v) }
    });
  };
}