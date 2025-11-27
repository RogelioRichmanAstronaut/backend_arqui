import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.debug('Registration attempt with DTO:', dto);
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    console.debug('Login attempt with DTO:', dto);
    return this.authService.login(dto);
  }
}

