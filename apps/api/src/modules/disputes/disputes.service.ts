import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { DisputeStatus, DisputeReason, ResolutionType, JobStatus } from '@depan-express/database';
import { APP_CONSTANTS } from '@depan-express/config';

interface OpenDisputeDto {
  jobId: string;
  reason: DisputeReason;
  description: string;
}

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async open(userId: string, dto: OpenDisputeDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Mission non trouvée');
    }

    // Verify the user is the customer
    if (job.customerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    // Check if job is completed
    if (job.jobStatus !== JobStatus.COMPLETED) {
      throw new BadRequestException('Vous ne pouvez ouvrir un litige que sur une mission terminée');
    }

    // Check deadline
    const completedAt = job.workCompletedAt;
    if (completedAt) {
      const deadline = new Date(completedAt);
      deadline.setDate(deadline.getDate() + APP_CONSTANTS.DISPUTE_OPENING_DAYS);

      if (new Date() > deadline) {
        throw new BadRequestException(
          `Le délai de ${APP_CONSTANTS.DISPUTE_OPENING_DAYS} jours pour ouvrir un litige est dépassé`,
        );
      }
    }

    // Check if dispute already exists
    const existingDispute = await this.prisma.dispute.findUnique({
      where: { jobId: dto.jobId },
    });

    if (existingDispute) {
      throw new BadRequestException('Un litige existe déjà pour cette mission');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        jobId: dto.jobId,
        openedByUserId: userId,
        disputeReason: dto.reason,
        description: dto.description,
        status: DisputeStatus.OPENED,
        openedAt: new Date(),
      },
    });

    return dispute;
  }

  async addEvidence(disputeId: string, userId: string, storageKey: string, mediaType: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { job: true },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    // Verify user is involved
    if (dispute.openedByUserId !== userId && dispute.job.professionalId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Ce litige est clôturé');
    }

    return this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        uploadedByUserId: userId,
        storageKey,
        mediaType: mediaType as any,
      },
    });
  }

  async getById(disputeId: string, userId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        job: {
          include: {
            customer: {
              select: {
                id: true,
                customerProfile: { select: { firstName: true, lastName: true } },
              },
            },
            professional: {
              select: {
                professionalProfile: { select: { firstName: true, lastName: true, businessName: true } },
              },
            },
            quotes: {
              where: { status: 'ACCEPTED' },
              take: 1,
            },
          },
        },
        evidences: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    // Verify user is involved
    if (dispute.openedByUserId !== userId && dispute.job.professionalId !== userId) {
      throw new NotFoundException('Litige non trouvé');
    }

    return dispute;
  }

  // Admin functions
  async resolve(
    disputeId: string,
    adminUserId: string,
    resolutionType: ResolutionType,
    notes?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolutionType,
        resolutionNotes: notes,
        resolvedAt: new Date(),
      },
    });
  }
}
