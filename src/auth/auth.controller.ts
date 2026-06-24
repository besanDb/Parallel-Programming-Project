import { Body, Controller, Post, Req } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { Public } from 'src/decorators/publicRoute.decorator';
import type { AuthRequest } from 'src/guards/authentication.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    return {
      data: await this.authService.register(registerData),
      message: 'Registered successfully',
    };
  }

  @Public()
  @Post('login')
  async login(@Body() loginData: LoginDto) {
    return {
      data: await this.authService.login(loginData),
      message: 'Logged in successfully',
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshToken: TokenDto) {
    return {
      data: await this.authService.refresh(refreshToken),
      message: 'New token generated successfully',
    };
  }

  @Post('logout')
  async logout(@Req() req: AuthRequest) {
    return (await this.authService.logout(+req.user.id))
      ? {
          message: 'Logged out successfully',
        }
      : {
          message: 'Logged out failed',
        };
  }
}
