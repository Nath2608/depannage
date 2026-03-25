import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ServiceRequestStatus, UrgencyType, TradeType, JobStatus, AssignmentStatus } from '@depan-express/database';
import { calculateDistance, estimateETA } from '@depan-express/utils';

interface CreateServiceRequestDto {
  requestedTrade: TradeType;
  problemCategory: string;
  urgencyType: UrgencyType;
  scheduledFor?: Date;
  addressId: string;
  description: string;
  accessNotes?: string;
}

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // CREATE REQUEST
  // ============================================================

  async create(customerId: string, dto: CreateServiceRequestDto) {
    // Verify address belongs to customer
    const address = await this.prisma.userAddress.findFirst({
      where: { id: dto.addressId, userId: customerId },
    });

    if (!address) {
      throw new BadRequestException('Adresse invalide');
    }

    // Calculate estimate
    const estimate = await this.calculateEstimate(
      dto.requestedTrade,
      dto.urgencyType,
      Number(address.latitude),
      Number(address.longitude),
    );

    const request = await this.prisma.serviceRequest.create({
      data: {
        customerId,
        requestedTrade: dto.requestedTrade,
        problemCategory: dto.problemCategory,
        urgencyType: dto.urgencyType,
        scheduledFor: dto.scheduledFor,
        addressId: dto.addressId,
        description: dto.description,
        accessNotes: dto.accessNotes,
        status: ServiceRequestStatus.SUBMITTED,
        estimatedPriceMin: estimate.priceMin,
        estimatedPriceMax: estimate.priceMax,
        estimatedEtaMinutes: estimate.etaMinutes,
      },
      include: {
        address: true,
      },
    });

    // Start dispatch process
    if (dto.urgencyType === UrgencyType.EMERGENCY) {
      await this.startDispatch(request.id);
    }

    return {
      request,
      estimate,
    };
  }

  // ============================================================
  // ESTIMATE
  // ============================================================

  async calculateEstimate(
    tradeType: TradeType,
    urgencyType: UrgencyType,
    latitude: number,
    longitude: number,
  ) {
    // Get pricing rules
    const pricingRule = await this.prisma.pricingRule.findFirst({
      where: {
        tradeType,
        urgencyType,
        isActive: true,
      },
    });

    if (!pricingRule) {
      throw new BadRequestException('Service non disponible');
    }

    // Count available professionals
    const availablePros = await this.findAvailableProfessionals(
      tradeType,
      latitude,
      longitude,
      urgencyType === UrgencyType.EMERGENCY,
    );

    const basePrice = Number(pricingRule.basePrice);
    const priceMin = basePrice;
    const priceMax = basePrice * 2.5; // Estimate max with parts and surcharges

    // Calculate average ETA
    let avgEta = 30;
    if (availablePros.length > 0) {
      const etas = availablePros.slice(0, 3).map((pro) => pro.etaMinutes);
      avgEta = Math.round(etas.reduce((a, b) => a + b, 0) / etas.length);
    }

    return {
      priceMin,
      priceMax,
      etaMinutes: avgEta,
      availableProfessionalsCount: availablePros.length,
    };
  }

  // ============================================================
  // DISPATCH
  // ============================================================

  async startDispatch(requestId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { address: true },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    // Update status
    await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: ServiceRequestStatus.SEARCHING },
    });

    // Find available professionals
    const availablePros = await this.findAvailableProfessionals(
      request.requestedTrade,
      Number(request.address.latitude),
      Number(request.address.longitude),
      request.urgencyType === UrgencyType.EMERGENCY,
    );

    if (availablePros.length === 0) {
      await this.prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: ServiceRequestStatus.NO_PROFESSIONAL_AVAILABLE },
      });
      return null;
    }

    // Create assignment for the best match
    const bestMatch = availablePros[0];
    if (!bestMatch) {
      return null;
    }

    const assignment = await this.prisma.jobAssignment.create({
      data: {
        requestId,
        professionalId: bestMatch.profileId,
        assignmentStatus: AssignmentStatus.PENDING,
      },
    });

    // TODO: Send push notification to professional

    return assignment;
  }

  async findAvailableProfessionals(
    tradeType: TradeType,
    latitude: number,
    longitude: number,
    isEmergency: boolean,
  ) {
    const now = new Date();
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
      now.getDay()
    ];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Get all active professionals for this trade
    const professionals = await this.prisma.professionalProfile.findMany({
      where: {
        tradeType,
        approvalStatus: 'APPROVED',
        isKycVerified: true,
        isActiveForDispatch: true,
        availability: {
          some: {
            dayOfWeek: dayOfWeek as any,
            startTime: { lte: currentTime },
            endTime: { gte: currentTime },
            ...(isEmergency && { isEmergencySlot: true }),
          },
        },
      },
      include: {
        serviceAreas: true,
        user: {
          select: { id: true },
        },
      },
    });

    // Filter by distance and calculate ETA
    const results = professionals
      .map((pro) => {
        // Find closest service area
        let minDistance = Infinity;
        for (const area of pro.serviceAreas) {
          const distance = calculateDistance(
            latitude,
            longitude,
            Number(area.latitude),
            Number(area.longitude),
          );
          if (distance < minDistance && distance <= area.radiusKm * 1000) {
            minDistance = distance;
          }
        }

        if (minDistance === Infinity) {
          return null;
        }

        return {
          profileId: pro.id,
          userId: pro.user.id,
          businessName: pro.businessName,
          rating: Number(pro.ratingAvg),
          distance: minDistance,
          etaMinutes: estimateETA(minDistance),
        };
      })
      .filter((p) => p !== null)
      .sort((a, b) => {
        // Sort by rating * (1 / distance) to favor closer and higher rated
        const scoreA = (a?.rating || 0) * (1 / ((a?.distance || 1) / 1000));
        const scoreB = (b?.rating || 0) * (1 / ((b?.distance || 1) / 1000));
        return scoreB - scoreA;
      });

    return results as NonNullable<(typeof results)[number]>[];
  }

  // ============================================================
  // GET REQUESTS
  // ============================================================

  async getById(id: string, userId: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        address: true,
        media: true,
        job: {
          include: {
            professional: {
              select: {
                professionalProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    businessName: true,
                    ratingAvg: true,
                  },
                },
              },
            },
            quotes: {
              where: { status: { in: ['SENT', 'ACCEPTED'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    // Verify ownership
    if (request.customerId !== userId) {
      throw new NotFoundException('Demande non trouvée');
    }

    return request;
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancel(id: string, userId: string) {
    const request = await this.getById(id, userId);

    // Can only cancel if not already assigned or in specific statuses
    const cancellableStatuses = [
      ServiceRequestStatus.DRAFT,
      ServiceRequestStatus.SUBMITTED,
      ServiceRequestStatus.SEARCHING,
    ];

    if (!cancellableStatuses.includes(request.status)) {
      throw new BadRequestException('Cette demande ne peut plus être annulée');
    }

    await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.CANCELLED_BY_CUSTOMER,
        cancelledAt: new Date(),
      },
    });

    return { success: true };
  }
}
