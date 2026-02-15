import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/types/request-with-user.interface';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  private checkAdminRole(req: RequestWithUser) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Only admins can access this resource');
    }
  }

  // ==================== User Management ====================
  @Get('users')
  async getAllUsers(
    @Query('role') role: string,
    @Query('status') status: string,
    @Query('search') search: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    return await this.adminService.getAllUsers({
      role,
      status,
      search,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('users/:uid')
  async getUserDetails(@Param('uid') uid: string, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.getUserDetails(uid);
  }

  @Put('users/:uid')
  async updateUser(@Param('uid') uid: string, @Body() updates: Record<string, any>, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.updateUser(uid, updates);
  }

  @Post('users/:uid/suspend')
  async suspendUser(
    @Param('uid') uid: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }
    return await this.adminService.suspendUser(uid, reason);
  }

  @Delete('users/:uid')
  async deleteUser(@Param('uid') uid: string, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.deleteUser(uid);
  }

  // ==================== Subscriptions Management ====================
  @Get('subscriptions')
  async getAllSubscriptions(
    @Query('status') status: string,
    @Query('userId') userId: string,
    @Query('planId') planId: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    return await this.adminService.getAllSubscriptions({
      status,
      userId,
      planId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('subscriptions/:subscriptionId')
  async getSubscriptionDetails(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.getSubscriptionDetails(subscriptionId);
  }

  @Put('subscriptions/:subscriptionId')
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() updates: Record<string, any>,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    return await this.adminService.updateSubscription(subscriptionId, updates);
  }

  @Post('subscriptions/:subscriptionId/pause')
  async pauseSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }
    return await this.adminService.pauseSubscription(subscriptionId, reason);
  }

  @Post('subscriptions/:subscriptionId/resume')
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.resumeSubscription(subscriptionId);
  }

  @Post('subscriptions/:subscriptionId/cancel')
  async cancelSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }
    return await this.adminService.cancelSubscription(subscriptionId, reason);
  }

  // ==================== Plans Management ====================
  @Get('plans')
  async getAllPlans(@Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.getAllPlans();
  }

  @Post('plans')
  async createPlan(@Body() planData: any, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    if (!planData.name || !planData.price || !planData.currency || !planData.billingCycle) {
      throw new BadRequestException('Missing required fields');
    }
    return await this.adminService.createPlan(planData);
  }

  @Put('plans/:planId')
  async updatePlan(@Param('planId') planId: string, @Body() updates: any, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.updatePlan(planId, updates);
  }

  @Post('plans/:planId/deactivate')
  async deactivatePlan(@Param('planId') planId: string, @Request() req: RequestWithUser) {
    this.checkAdminRole(req);
    return await this.adminService.deactivatePlan(planId);
  }

  // ==================== Invoices Management ====================
  @Get('invoices')
  async getAllInvoices(
    @Query('status') status: string,
    @Query('userId') userId: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    return await this.adminService.getAllInvoices({
      status,
      userId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Put('invoices/:invoiceId/status')
  async updateInvoiceStatus(
    @Param('invoiceId') invoiceId: string,
    @Body('status') status: string,
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    return await this.adminService.updateInvoiceStatus(invoiceId, status as any);
  }

  // ==================== Notifications ====================
  @Post('notifications/send')
  async sendNotification(
    @Body() data: { userId: string; title: string; message: string; type: string },
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!data.userId || !data.title || !data.message || !data.type) {
      throw new BadRequestException('Missing required fields');
    }
    return await this.adminService.sendNotificationToUser(
      data.userId,
      data.title,
      data.message,
      data.type,
    );
  }

  @Post('notifications/bulk')
  async sendBulkNotification(
    @Body() data: { userIds: string[]; title: string; message: string; type: string },
    @Request() req: RequestWithUser,
  ) {
    this.checkAdminRole(req);
    if (!data.userIds || !data.title || !data.message || !data.type) {
      throw new BadRequestException('Missing required fields');
    }
    return await this.adminService.sendBulkNotification(
      data.userIds,
      data.title,
      data.message,
      data.type,
    );
  }
}

