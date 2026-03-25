import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles, CurrentUser, CurrentUserPayload } from '@common/decorators';
import { UserRole, ApprovalStatus } from '@depan-express/types';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================
  // DASHBOARD
  // ============================================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Récupérer les statistiques du tableau de bord admin' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================================
  // CUSTOMERS
  // ============================================================

  @Get('customers')
  @ApiOperation({ summary: 'Lister les clients' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getCustomers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getCustomers(page, limit, search);
  }

  // ============================================================
  // PROFESSIONALS
  // ============================================================

  @Get('professionals')
  @ApiOperation({ summary: 'Lister les professionnels' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ApprovalStatus })
  async getProfessionals(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: ApprovalStatus,
  ) {
    return this.adminService.getProfessionals(page, limit, status);
  }

  @Post('professionals/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approuver un professionnel' })
  async approveProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.adminService.approveProfessional(id, admin.sub);
  }

  @Post('professionals/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rejeter un professionnel' })
  async rejectProfessional(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() body: { reason: string },
  ) {
    return this.adminService.rejectProfessional(id, admin.sub, body.reason);
  }

  // ============================================================
  // ACCOUNT MANAGEMENT
  // ============================================================

  @Post('users/:id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspendre un compte' })
  async suspendAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Body() body: { reason: string },
  ) {
    return this.adminService.suspendAccount(id, admin.sub, body.reason);
  }

  @Post('users/:id/reactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Réactiver un compte' })
  async reactivateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.adminService.reactivateAccount(id, admin.sub);
  }

  // ============================================================
  // JOBS
  // ============================================================

  @Get('jobs')
  @ApiOperation({ summary: 'Lister toutes les missions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getJobs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getJobs(page, limit, status);
  }

  // ============================================================
  // DISPUTES
  // ============================================================

  @Get('disputes')
  @ApiOperation({ summary: 'Lister les litiges' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getDisputes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.adminService.getDisputes(page, limit, status);
  }

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  @Get('audit-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Consulter les logs d\'audit' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('entityType') entityType?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit, entityType);
  }
}
