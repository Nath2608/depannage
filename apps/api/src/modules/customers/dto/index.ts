import { IsString, IsOptional, IsBoolean, MaxLength, IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Dupont' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Domicile' })
  @IsString()
  @MaxLength(50)
  label!: string;

  @ApiProperty({ example: '15 Rue de la Paix' })
  @IsString()
  @MaxLength(255)
  streetLine1!: string;

  @ApiPropertyOptional({ example: 'Bâtiment A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  streetLine2?: string;

  @ApiProperty({ example: '75002' })
  @IsString()
  @MaxLength(10)
  postalCode!: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional({ example: 'FR' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiProperty({ example: 48.8698 })
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 2.3298 })
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 'Digicode 1234, 3ème étage' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  accessNotes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends CreateAddressDto {}
