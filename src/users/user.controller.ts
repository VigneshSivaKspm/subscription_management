import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { RequestWithUser } from '../auth/types/request-with-user.interface';
import { ConfigService } from '@nestjs/config';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const user = await this.userService.findUserById(userId);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body()
    updateData: {
      name?: string;
      surname?: string;
      date_of_birth?: Date;
      gender?: string;
    },
  ) {
    const userId = req.user.userId;
    return this.userService.updateProfile(userId, updateData);
  }
}
