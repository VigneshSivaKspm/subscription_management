import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/types/request-with-user.interface';

@Controller('api/subscriptions')
@UseGuards(JwtAuthGuard)
export class UserSubscriptionController {
  constructor(private userSubscriptionService: UserSubscriptionService) {}

  @Get()
  async getUserSubscriptions(@Request() req: RequestWithUser) {
    return await this.userSubscriptionService.getUserSubscriptions(req.user.userId);
  }

  @Get('summary')
  async getSubscriptionSummary(@Request() req: RequestWithUser) {
    return await this.userSubscriptionService.getSubscriptionSummary(req.user.userId);
  }

  @Get('plans')
  async getAvailablePlans() {
    return await this.userSubscriptionService.getAvailablePlans();
  }

  @Get('invoices')
  async getUserInvoices(@Request() req: RequestWithUser, @Query('status') status: string) {
    return await this.userSubscriptionService.getUserInvoices(req.user.userId, status);
  }

  @Get(':subscriptionId')
  async getSubscriptionDetails(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    return await this.userSubscriptionService.getSubscriptionDetails(
      req.user.userId,
      subscriptionId,
    );
  }

  @Post()
  async createSubscription(
    @Body() data: { planId: string; autoRenew?: boolean; notes?: string },
    @Request() req: RequestWithUser,
  ) {
    if (!data.planId) {
      throw new BadRequestException('planId is required');
    }
    return await this.userSubscriptionService.createSubscription(
      req.user.userId,
      data.planId,
      data.autoRenew,
      data.notes,
    );
  }

  @Post(':subscriptionId/renew')
  async renewSubscription(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    return await this.userSubscriptionService.renewSubscription(req.user.userId, subscriptionId);
  }

  @Post(':subscriptionId/cancel')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    if (!reason) {
      throw new BadRequestException('Cancellation reason is required');
    }
    return await this.userSubscriptionService.cancelSubscription(
      req.user.userId,
      subscriptionId,
      reason,
    );
  }

  @Post(':subscriptionId/pause')
  async pauseSubscription(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    return await this.userSubscriptionService.pauseSubscription(req.user.userId, subscriptionId);
  }

  @Post(':subscriptionId/resume')
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    return await this.userSubscriptionService.resumeSubscription(req.user.userId, subscriptionId);
  }

  @Put(':subscriptionId/auto-renew')
  async updateAutoRenew(
    @Param('subscriptionId') subscriptionId: string,
    @Body('autoRenew') autoRenew: boolean,
    @Request() req: RequestWithUser,
  ) {
    if (autoRenew === undefined || autoRenew === null) {
      throw new BadRequestException('autoRenew is required');
    }
    return await this.userSubscriptionService.updateAutoRenew(
      req.user.userId,
      subscriptionId,
      autoRenew,
    );
  }
}
