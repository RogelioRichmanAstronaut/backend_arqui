import { Transform } from 'class-transformer';

export const ToNumber = () =>
  Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : Number(value),
  );

export const ToTrimmed = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const ToLower = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value));