import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserStatus } from '@depan-express/database';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Ce compte a été supprimé');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Ce compte est suspendu');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Ce compte est inactif');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
