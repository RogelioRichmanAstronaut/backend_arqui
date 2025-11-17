import { registerDecorator, ValidationOptions } from 'class-validator';
export function IsClientID(opts?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    registerDecorator({
      name: 'IsClientID',
      target: target.constructor,
      propertyName,
      options: { message: '$property debe cumplir <tipoDoc>-<numero>', ...opts },
      validator: { validate: (v: any) => typeof v === 'string' && /^[A-Z]{2,5}-[A-Za-z0-9]+$/.test(v) }
    });
  };
}