import { registerDecorator, ValidationOptions } from 'class-validator';
export function IsTransactionID(opts?: ValidationOptions) {
  return function (target: any, propertyName: string) {
    registerDecorator({
      name: 'IsTransactionID',
      target: target.constructor,
      propertyName,
      options: { message: '$property debe cumplir <BANCO>-YYYYMMDD-<SUFIJO>', ...opts },
      validator: { validate: (v: any) => typeof v === 'string' && /^[A-Z]{3,}-\d{8}-[A-Z0-9]{4,}$/.test(v) }
    });
  };
}