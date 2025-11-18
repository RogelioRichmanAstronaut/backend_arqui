import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(dto: LoginDto) {
    // En prod: Validar contra DB y hash de contraseña.
    // Simulación para cumplir el caso de uso:
    if (dto.email === 'admin@turismo.com' && dto.password === 'admin123') {
      const payload = { email: dto.email, sub: 'user-admin-01', role: 'ADMIN' };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException('Credenciales inválidas');
  }
}

