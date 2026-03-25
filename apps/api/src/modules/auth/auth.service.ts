import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

import { PrismaService } from '@common/prisma/prisma.service';
import { UserRole, UserStatus, OtpChannel, SecurityEventSeverity } from '@depan-express/database';
import { SignupDto, LoginDto, RefreshTokenDto } from './dto';
import { APP_CONSTANTS, ERROR_CODES } from '@depan-express/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // SIGNUP
  // ============================================================

  async signup(dto: SignupDto) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException({
        code: ERROR_CODES.USER_EMAIL_TAKEN,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Check if phone already exists
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existingPhone) {
        throw new ConflictException({
          code: ERROR_CODES.USER_PHONE_TAKEN,
          message: 'Ce numéro de téléphone est déjà utilisé',
        });
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // Create user with transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          phone: dto.phone || null,
          passwordHash,
          role: dto.role,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      // Create profile based on role
      if (dto.role === UserRole.CUSTOMER) {
        await tx.customerProfile.create({
          data: {
            userId: newUser.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
          },
        });
      }

      // Log security event
      await tx.securityEvent.create({
        data: {
          userId: newUser.id,
          eventType: 'ACCOUNT_CREATED',
          severity: SecurityEventSeverity.LOW,
          metadata: {
            role: dto.role,
            email: dto.email,
          },
        },
      });

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    // TODO: Send verification email
    // await this.sendVerificationEmail(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
        message: `Compte verrouillé. Réessayez dans ${minutesLeft} minutes.`,
      });
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = APP_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS;

      if (failedAttempts >= maxAttempts) {
        const lockDuration = APP_CONSTANTS.ACCOUNT_LOCK_DURATION_MINUTES;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: new Date(Date.now() + lockDuration * 60000),
          },
        });

        // Log security event
        await this.prisma.securityEvent.create({
          data: {
            userId: user.id,
            eventType: 'ACCOUNT_LOCKED',
            severity: SecurityEventSeverity.HIGH,
            metadata: { failedAttempts, ipAddress },
          },
        });

        throw new UnauthorizedException({
          code: ERROR_CODES.AUTH_ACCOUNT_LOCKED,
          message: `Compte verrouillé suite à ${maxAttempts} tentatives échouées. Réessayez dans ${lockDuration} minutes.`,
        });
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts },
      });

      // Log failed attempt
      await this.prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: 'LOGIN_FAILURE',
          severity: SecurityEventSeverity.MEDIUM,
          metadata: { ipAddress, attemptsRemaining: maxAttempts - failedAttempts },
        },
      });

      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check account status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_ACCOUNT_SUSPENDED,
        message: 'Ce compte est suspendu',
      });
    }

    if (user.deletedAt) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      return {
        requires2FA: true,
        tempToken: await this.generateTempToken(user.id),
      };
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Log successful login
    await this.prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'LOGIN_SUCCESS',
        severity: SecurityEventSeverity.LOW,
        metadata: { ipAddress },
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refreshToken(dto: RefreshTokenDto) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Hash the incoming refresh token
      const tokenHash = this.hashToken(dto.refreshToken);

      // Find session
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: payload.sub,
          refreshTokenHash: tokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException({
          code: ERROR_CODES.AUTH_INVALID_TOKEN,
          message: 'Session invalide ou expirée',
        });
      }

      // Revoke old session (rotation)
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(session.user);

      // Create new session
      await this.createSession(
        session.userId,
        tokens.refreshToken,
        session.ipAddress || undefined,
        session.userAgent || undefined,
      );

      // Log token refresh
      await this.prisma.securityEvent.create({
        data: {
          userId: session.userId,
          eventType: 'TOKEN_REFRESH',
          severity: SecurityEventSeverity.LOW,
          metadata: {},
        },
      });

      return {
        ...tokens,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_TOKEN,
        message: 'Refresh token invalide ou expiré',
      });
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.userSession.updateMany({
        where: {
          userId,
          refreshTokenHash: tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all sessions
      await this.prisma.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'LOGOUT',
        severity: SecurityEventSeverity.LOW,
        metadata: { allSessions: !refreshToken },
      },
    });

    return { success: true };
  }

  // ============================================================
  // 2FA
  // ============================================================

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA déjà activé');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'DepanExpress', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (will be confirmed after verification)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCodeUrl,
    };
  }

  async verify2FA(userId: string, code: string, isEnabling: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA non configuré');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'TWO_FA_FAILED',
          severity: SecurityEventSeverity.MEDIUM,
          metadata: {},
        },
      });

      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_2FA_INVALID,
        message: 'Code 2FA invalide',
      });
    }

    if (isEnabling) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });

      await this.prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'TWO_FA_ENABLED',
          severity: SecurityEventSeverity.MEDIUM,
          metadata: {},
        },
      });
    }

    return { success: true };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA non activé');
    }

    // Verify code before disabling
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_2FA_INVALID,
        message: 'Code 2FA invalide',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'TWO_FA_DISABLED',
        severity: SecurityEventSeverity.MEDIUM,
        metadata: {},
      },
    });

    return { success: true };
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate reset token
    const token = uuidv4();
    const tokenHash = this.hashToken(token);

    // Store OTP
    await this.prisma.otpCode.create({
      data: {
        userId: user.id,
        channel: OtpChannel.EMAIL,
        codeHash: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    this.logger.log(`Password reset token for ${email}: ${token}`);

    await this.prisma.securityEvent.create({
      data: {
        userId: user.id,
        eventType: 'PASSWORD_RESET_REQUESTED',
        severity: SecurityEventSeverity.MEDIUM,
        metadata: {},
      },
    });

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);

    const otpCode = await this.prisma.otpCode.findFirst({
      where: {
        codeHash: tokenHash,
        channel: OtpChannel.EMAIL,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!otpCode) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_INVALID_TOKEN,
        message: 'Lien de réinitialisation invalide ou expiré',
      });
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: otpCode.userId },
        data: { passwordHash },
      }),
      this.prisma.otpCode.update({
        where: { id: otpCode.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all sessions
      this.prisma.userSession.updateMany({
        where: { userId: otpCode.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.securityEvent.create({
        data: {
          userId: otpCode.userId,
          eventType: 'PASSWORD_RESET_COMPLETED',
          severity: SecurityEventSeverity.HIGH,
          metadata: {},
        },
      }),
    ]);

    return { success: true };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async generateTokens(user: { id: string; email: string; role: UserRole }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private async generateTempToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, type: '2fa_pending' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '5m',
      },
    );
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: tokenHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
      },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.configService.get<number>('ARGON2_MEMORY_COST', 65536),
      timeCost: this.configService.get<number>('ARGON2_TIME_COST', 3),
      parallelism: this.configService.get<number>('ARGON2_PARALLELISM', 4),
    });
  }

  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
