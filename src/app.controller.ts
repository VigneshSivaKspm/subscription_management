import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('status')
  getHello(): string {
    return 'NestJS Membership API is running!';
  }
}
