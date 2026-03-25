import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ApprovalStatus, TradeType } from '@depan-express/types';
import {
  ProfessionalOnboardingDto,
  UpdateProfessionalProfileDto,
  UpdateAvailabilityDto,
  UpdateServiceAreaDto,
  SetSpecialtiesDto,
} from './dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // ONBOARDING
  // ============================================================

  async onboard(userId: string, dto: ProfessionalOnboardingDto) {
    // Check if already onboarded
    const existing = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Profil professionnel déjà créé');
    }

    // Check SIRET uniqueness
    const existingSiret = await this.prisma.professionalProfile.findUnique({
      where: { siret: dto.siret },
    });

    if (existingSiret) {
      throw new ConflictException('Ce SIRET est déjà enregistré');
    }

    return this.prisma.professionalProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tradeType: dto.tradeType as TradeType,
        companyType: dto.companyType,
        siret: dto.siret,
        vatNumber: dto.vatNumber,
        yearsOfExperience: dto.yearsOfExperience,
        bio: dto.bio,
        approvalStatus: ApprovalStatus.PENDING,
      },
    });
  }

  // ============================================================
  // PROFILE
  // ============================================================

  async getProfile(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isEmailVerified: true,
            isPhoneVerified: true,
          },
        },
        specialties: true,
        serviceAreas: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            verificationStatus: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        bankAccounts: {
          where: { isDefault: true },
          select: {
            id: true,
            ibanLast4: true,
            accountHolderName: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfessionalProfileDto) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    return this.prisma.professionalProfile.update({
      where: { userId },
      data: dto,
    });
  }

  // ============================================================
  // SPECIALTIES
  // ============================================================

  async setSpecialties(userId: string, dto: SetSpecialtiesDto) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    // Delete existing and create new
    await this.prisma.professionalSpecialty.deleteMany({
      where: { professionalId: profile.id },
    });

    await this.prisma.professionalSpecialty.createMany({
      data: dto.specialtyCodes.map((code) => ({
        professionalId: profile.id,
        specialtyCode: code,
      })),
    });

    return this.prisma.professionalSpecialty.findMany({
      where: { professionalId: profile.id },
    });
  }

  // ============================================================
  // SERVICE AREAS
  // ============================================================

  async getServiceAreas(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.professionalServiceArea.findMany({
      where: { professionalId: profile.id },
    });
  }

  async addServiceArea(userId: string, dto: UpdateServiceAreaDto) {
    const profile = await this.getProfileByUserId(userId);

    return this.prisma.professionalServiceArea.create({
      data: {
        professionalId: profile.id,
        city: dto.city,
        postalCode: dto.postalCode,
        radiusKm: dto.radiusKm,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async updateServiceArea(userId: string, areaId: string, dto: UpdateServiceAreaDto) {
    const profile = await this.getProfileByUserId(userId);

    const area = await this.prisma.professionalServiceArea.findFirst({
      where: { id: areaId, professionalId: profile.id },
    });

    if (!area) {
      throw new NotFoundException('Zone de service non trouvée');
    }

    return this.prisma.professionalServiceArea.update({
      where: { id: areaId },
      data: dto,
    });
  }

  async deleteServiceArea(userId: string, areaId: string) {
    const profile = await this.getProfileByUserId(userId);

    const area = await this.prisma.professionalServiceArea.findFirst({
      where: { id: areaId, professionalId: profile.id },
    });

    if (!area) {
      throw new NotFoundException('Zone de service non trouvée');
    }

    await this.prisma.professionalServiceArea.delete({
      where: { id: areaId },
    });

    return { success: true };
  }

  // ============================================================
  // AVAILABILITY
  // ============================================================

  async getAvailability(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.professionalAvailability.findMany({
      where: { professionalId: profile.id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setAvailability(userId: string, dto: UpdateAvailabilityDto[]) {
    const profile = await this.getProfileByUserId(userId);

    // Delete existing
    await this.prisma.professionalAvailability.deleteMany({
      where: { professionalId: profile.id },
    });

    // Create new
    await this.prisma.professionalAvailability.createMany({
      data: dto.map((item) => ({
        professionalId: profile.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isEmergencySlot: item.isEmergencySlot || false,
      })),
    });

    return this.getAvailability(userId);
  }

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  async getDashboardStats(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get earnings
    const [todayPayouts, weekPayouts, monthPayouts] = await Promise.all([
      this.prisma.payout.aggregate({
        where: {
          professionalId: profile.id,
          paidAt: { gte: startOfDay },
        },
        _sum: { netAmount: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          professionalId: profile.id,
          paidAt: { gte: startOfWeek },
        },
        _sum: { netAmount: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          professionalId: profile.id,
          paidAt: { gte: startOfMonth },
        },
        _sum: { netAmount: true },
      }),
    ]);

    // Get job counts
    const jobs = await this.prisma.job.groupBy({
      by: ['jobStatus'],
      where: { professionalId: profile.userId },
      _count: true,
    });

    const jobCounts = jobs.reduce(
      (acc, job) => {
        acc[job.jobStatus] = job._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      todayEarnings: todayPayouts._sum.netAmount || 0,
      weekEarnings: weekPayouts._sum.netAmount || 0,
      monthEarnings: monthPayouts._sum.netAmount || 0,
      totalJobs: profile.jobCount,
      completedJobs: jobCounts.COMPLETED || 0,
      cancelledJobs: (jobCounts.CANCELLED_BY_CUSTOMER || 0) + (jobCounts.CANCELLED_BY_PROFESSIONAL || 0),
      averageRating: profile.ratingAvg,
      totalReviews: profile.ratingCount,
    };
  }

  // ============================================================
  // JOBS HISTORY
  // ============================================================

  async getJobs(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { professionalId: userId };
    if (status) {
      where.jobStatus = status;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          request: {
            include: { address: true },
          },
          customer: {
            select: {
              id: true,
              customerProfile: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          quotes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // PAYOUTS
  // ============================================================

  async getPayouts(userId: string, page = 1, limit = 20) {
    const profile = await this.getProfileByUserId(userId);
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where: { professionalId: profile.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({
        where: { professionalId: profile.id },
      }),
    ]);

    return {
      items: payouts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    return profile;
  }
}
