import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role.guard';
import { RequestWithUser } from '../auth/types/request-with-user.interface';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access dashboard stats');
    }
    return await this.analyticsService.getDashboardStats();
  }

  @Get('user-stats')
  async getUserStats(@Request() req: RequestWithUser) {
    return await this.analyticsService.getUserStats(req.user.userId);
  }

  @Get('subscriptions')
  async getSubscriptionStats(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access subscription stats');
    }
    return await this.analyticsService.getSubscriptionStats();
  }

  @Get('revenue')
  async getRevenueReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access revenue reports');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return await this.analyticsService.getRevenueReport(start, end);
  }

  @Get('user-growth')
  async getUserGrowthReport(@Query('days') days: string, @Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access user growth reports');
    }

    const daysNum = days ? parseInt(days, 10) : 30;
    return await this.analyticsService.getUserGrowthReport(daysNum);
  }

  @Get('churn')
  async getChurnAnalysis(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access churn analysis');
    }
    return await this.analyticsService.getChurnAnalysis();
  }

  @Get('payments')
  async getPaymentMetrics(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access payment metrics');
    }
    return await this.analyticsService.getPaymentMetrics();
  }

  @Get('top-plans')
  async getTopPlans(@Request() req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access top plans');
    }
    return await this.analyticsService.getTopPlans();
  }

  @Get('events/:userId')
  async getUserEvents(@Param('userId') userId: string, @Request() req: RequestWithUser) {
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    return await this.analyticsService.getUserStats(userId);
  }
}
