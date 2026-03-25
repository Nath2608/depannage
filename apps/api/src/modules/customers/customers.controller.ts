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

import { CustomersService } from './customers.service';
import { UpdateCustomerProfileDto, CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles, CurrentUser, CurrentUserPayload } from '@common/decorators';
import { UserRole } from '@depan-express/types';

@ApiTags('Customers')
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ============================================================
  // PROFILE
  // ============================================================

  @Get('profile')
  @ApiOperation({ summary: 'Récupérer son profil client' })
  @ApiResponse({ status: 200, description: 'Profil client' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.customersService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Mettre à jour son profil client' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customersService.updateProfile(user.sub, dto);
  }

  // ============================================================
  // ADDRESSES
  // ============================================================

  @Get('addresses')
  @ApiOperation({ summary: 'Lister ses adresses' })
  @ApiResponse({ status: 200, description: 'Liste des adresses' })
  async getAddresses(@CurrentUser() user: CurrentUserPayload) {
    return this.customersService.getAddresses(user.sub);
  }

  @Get('addresses/:id')
  @ApiOperation({ summary: 'Récupérer une adresse' })
  @ApiResponse({ status: 200, description: 'Détail de l\'adresse' })
  async getAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    return this.customersService.getAddress(user.sub, addressId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Créer une adresse' })
  @ApiResponse({ status: 201, description: 'Adresse créée' })
  async createAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.customersService.createAddress(user.sub, dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Mettre à jour une adresse' })
  @ApiResponse({ status: 200, description: 'Adresse mise à jour' })
  async updateAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.customersService.updateAddress(user.sub, addressId, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Supprimer une adresse' })
  @ApiResponse({ status: 200, description: 'Adresse supprimée' })
  async deleteAddress(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) addressId: string,
  ) {
    return this.customersService.deleteAddress(user.sub, addressId);
  }

  // ============================================================
  // SERVICE REQUESTS HISTORY
  // ============================================================

  @Get('requests')
  @ApiOperation({ summary: 'Historique des demandes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des demandes' })
  async getServiceRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.getServiceRequests(user.sub, page, limit);
  }

  // ============================================================
  // INVOICES
  // ============================================================

  @Get('invoices')
  @ApiOperation({ summary: 'Lister ses factures' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async getInvoices(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.getInvoices(user.sub, page, limit);
  }
}
