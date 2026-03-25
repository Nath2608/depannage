import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
  Max,
  Matches,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradeType, CompanyType, DayOfWeek } from '@depan-express/types';

export class ProfessionalOnboardingDto {
  @ApiProperty({ example: 'Plomberie Express' })
  @IsString()
  @MaxLength(200)
  businessName!: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ enum: TradeType })
  @IsEnum(TradeType)
  tradeType!: TradeType;

  @ApiProperty({ enum: CompanyType })
  @IsEnum(CompanyType)
  companyType!: CompanyType;

  @ApiProperty({ example: '12345678901234' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'Le SIRET doit contenir 14 chiffres' })
  siret!: string;

  @ApiPropertyOptional({ example: 'FR12345678901' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}

export class UpdateProfessionalProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActiveForDispatch?: boolean;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime!: string;

  @ApiProperty({ example: '19:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEmergencySlot?: boolean;
}

export class UpdateServiceAreaDto {
  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '75000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(1)
  @Max(50)
  radiusKm!: number;

  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  @IsLongitude()
  longitude!: number;
}

export class SetSpecialtiesDto {
  @ApiProperty({ example: ['LEAK_REPAIR', 'PIPE_UNCLOGGING'] })
  @IsArray()
  @IsString({ each: true })
  specialtyCodes!: string[];
}
