import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    // Aquí puedes añadir verificaciones de DB/Redis/etc en pasos posteriores
    return { status: 'ready', ts: new Date().toISOString() };
  }
}