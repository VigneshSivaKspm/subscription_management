import { Controller, Post, Body, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequestWithUser } from './types/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() userData: { email: string; password: string; name: string },
  ) {
    try {
      if (!userData.email || !userData.password || !userData.name) {
        throw new BadRequestException('Email, password, and name are required');
      }
      return await this.authService.register(userData);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(@Body() credentials: { email: string; password: string }) {
    try {
      if (!credentials.email || !credentials.password) {
        throw new BadRequestException('Email and password are required');
      }
      return await this.authService.login(credentials.email, credentials.password);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Req() req: RequestWithUser) {
    return this.authService.validateToken(req.user);
  }
}
