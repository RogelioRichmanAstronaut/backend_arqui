import { ValidationPipe, BadRequestException, ValidationError } from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors: ValidationError[]) => {
    const normalized = errors.flatMap((e) => flattenErrors(e));
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: normalized,
    });
  },
});

function flattenErrors(e: ValidationError, path: string[] = []): any[] {
  const currentPath = [...path, e.property];
  const fromChildren = (e.children ?? []).flatMap((c) => flattenErrors(c, currentPath));
  const here = e.constraints
    ? [{ property: currentPath.join('.'), constraints: e.constraints, valuePath: currentPath }]
    : [];
  return [...here, ...fromChildren];
}