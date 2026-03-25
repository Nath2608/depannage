import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
  AuthResponseDto,
  Enable2FAResponseDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public, CurrentUser, CurrentUserPayload } from '@common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // SIGNUP
  // ============================================================

  @Post('signup')
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Créer un nouveau compte' })
  @ApiResponse({ status: 201, description: 'Compte créé', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email ou téléphone déjà utilisé' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // ============================================================
  // LOGIN
  // ============================================================

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Se connecter' })
  @ApiResponse({ status: 200, description: 'Connexion réussie', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens' })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Se déconnecter' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { refreshToken?: string },
  ) {
    return this.authService.logout(user.sub, body.refreshToken);
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Email envoyé si le compte existe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ============================================================
  // 2FA
  // ============================================================

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activer la double authentification' })
  @ApiResponse({ status: 200, description: 'Secret et QR code générés', type: Enable2FAResponseDto })
  async enable2FA(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.enable2FA(user.sub);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vérifier et activer la 2FA' })
  @ApiResponse({ status: 200, description: '2FA activée' })
  @ApiResponse({ status: 401, description: 'Code invalide' })
  async verify2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.verify2FA(user.sub, dto.code, true);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Désactiver la double authentification' })
  @ApiResponse({ status: 200, description: '2FA désactivée' })
  @ApiResponse({ status: 401, description: 'Code invalide' })
  async disable2FA(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.disable2FA(user.sub, dto.code);
  }
}
