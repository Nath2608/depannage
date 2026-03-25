export * from './signup.dto';
export * from './login.dto';
export * from './refresh-token.dto';

import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecureP@ss123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}

export class Enable2FAResponseDto {
  @ApiProperty()
  secret: string;

  @ApiProperty()
  qrCodeUrl: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    role: string;
  };
}
