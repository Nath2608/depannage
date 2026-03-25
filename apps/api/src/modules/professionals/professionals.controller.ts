import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { ProfessionalsService } from './professionals.service';
import {
  ProfessionalOnboardingDto,
  UpdateProfessionalProfileDto,
  UpdateAvailabilityDto,
  UpdateServiceAreaDto,
  SetSpecialtiesDto,
} from './dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles, CurrentUser, CurrentUserPayload } from '@common/decorators';
import { UserRole } from '@depan-express/types';

@ApiTags('Professionals')
@Controller('professional')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROFESSIONAL)
@ApiBearerAuth('JWT-auth')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  // ============================================================
  // ONBOARDING
  // ============================================================

  @Post('onboard')
  @ApiOperation({ summary: 'Compléter l\'onboarding professionnel' })
  @ApiResponse({ status: 201, description: 'Profil professionnel créé' })
  async onboard(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ProfessionalOnboardingDto,
  ) {
    return this.professionalsService.onboard(user.sub, dto);
  }

  // ============================================================
  // PROFILE
  // ============================================================

  @Get('profile')
  @ApiOperation({ summary: 'Récupérer son profil professionnel' })
  @ApiResponse({ status: 200, description: 'Profil professionnel' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.professionalsService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Mettre à jour son profil professionnel' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.professionalsService.updateProfile(user.sub, dto);
  }

  // ============================================================
  // SPECIALTIES
  // ============================================================

  @Put('specialties')
  @ApiOperation({ summary: 'Définir ses spécialités' })
  @ApiResponse({ status: 200, description: 'Spécialités mises à jour' })
  async setSpecialties(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SetSpecialtiesDto,
  ) {
    return this.professionalsService.setSpecialties(user.sub, dto);
  }

  // ============================================================
  // SERVICE AREAS
  // ============================================================

  @Get('service-areas')
  @ApiOperation({ summary: 'Lister ses zones d\'intervention' })
  @ApiResponse({ status: 200, description: 'Liste des zones' })
  async getServiceAreas(@CurrentUser() user: CurrentUserPayload) {
    return this.professionalsService.getServiceAreas(user.sub);
  }

  @Post('service-areas')
  @ApiOperation({ summary: 'Ajouter une zone d\'intervention' })
  @ApiResponse({ status: 201, description: 'Zone ajoutée' })
  async addServiceArea(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateServiceAreaDto,
  ) {
    return this.professionalsService.addServiceArea(user.sub, dto);
  }

  @Put('service-areas/:id')
  @ApiOperation({ summary: 'Modifier une zone d\'intervention' })
  @ApiResponse({ status: 200, description: 'Zone modifiée' })
  async updateServiceArea(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) areaId: string,
    @Body() dto: UpdateServiceAreaDto,
  ) {
    return this.professionalsService.updateServiceArea(user.sub, areaId, dto);
  }

  @Delete('service-areas/:id')
  @ApiOperation({ summary: 'Supprimer une zone d\'intervention' })
  @ApiResponse({ status: 200, description: 'Zone supprimée' })
  async deleteServiceArea(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) areaId: string,
  ) {
    return this.professionalsService.deleteServiceArea(user.sub, areaId);
  }

  // ============================================================
  // AVAILABILITY
  // ============================================================

  @Get('availability')
  @ApiOperation({ summary: 'Récupérer ses disponibilités' })
  @ApiResponse({ status: 200, description: 'Liste des disponibilités' })
  async getAvailability(@CurrentUser() user: CurrentUserPayload) {
    return this.professionalsService.getAvailability(user.sub);
  }

  @Put('availability')
  @ApiOperation({ summary: 'Définir ses disponibilités' })
  @ApiResponse({ status: 200, description: 'Disponibilités mises à jour' })
  async setAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAvailabilityDto[],
  ) {
    return this.professionalsService.setAvailability(user.sub, dto);
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Récupérer les statistiques du tableau de bord' })
  @ApiResponse({ status: 200, description: 'Statistiques' })
  async getDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    return this.professionalsService.getDashboardStats(user.sub);
  }

  // ============================================================
  // JOBS
  // ============================================================

  @Get('jobs')
  @ApiOperation({ summary: 'Historique des missions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des missions' })
  async getJobs(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.professionalsService.getJobs(user.sub, page, limit, status);
  }

  // ============================================================
  // PAYOUTS
  // ============================================================

  @Get('payouts')
  @ApiOperation({ summary: 'Historique des virements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des virements' })
  async getPayouts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.professionalsService.getPayouts(user.sub, page, limit);
  }
}
