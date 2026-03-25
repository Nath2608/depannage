import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { JobStatus, ServiceRequestStatus, AssignmentStatus } from '@depan-express/types';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async acceptAssignment(professionalUserId: string, assignmentId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        request: true,
        professional: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment non trouvé');
    }

    if (assignment.professional.userId !== professionalUserId) {
      throw new BadRequestException('Non autorisé');
    }

    if (assignment.assignmentStatus !== AssignmentStatus.PENDING) {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    // Update assignment
    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: {
        assignmentStatus: AssignmentStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    // Update request
    await this.prisma.serviceRequest.update({
      where: { id: assignment.requestId },
      data: {
        status: ServiceRequestStatus.ASSIGNED,
        assignedProfessionalId: assignment.professionalId,
      },
    });

    // Create job
    const job = await this.prisma.job.create({
      data: {
        requestId: assignment.requestId,
        customerId: assignment.request.customerId,
        professionalId: professionalUserId,
        jobStatus: JobStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        request: { include: { address: true } },
        customer: {
          select: {
            customerProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return job;
  }

  async declineAssignment(professionalUserId: string, assignmentId: string, reason?: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { professional: true },
    });

    if (!assignment || assignment.professional.userId !== professionalUserId) {
      throw new NotFoundException('Assignment non trouvé');
    }

    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: {
        assignmentStatus: AssignmentStatus.DECLINED,
        respondedAt: new Date(),
        responseReason: reason,
      },
    });

    // TODO: Try next professional

    return { success: true };
  }

  async updateStatus(jobId: string, professionalUserId: string, newStatus: JobStatus) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.professionalId !== professionalUserId) {
      throw new NotFoundException('Mission non trouvée');
    }

    // Validate status transition
    const validTransitions: Record<string, JobStatus[]> = {
      [JobStatus.ACCEPTED]: [JobStatus.EN_ROUTE, JobStatus.CANCELLED_BY_PROFESSIONAL],
      [JobStatus.EN_ROUTE]: [JobStatus.ARRIVED, JobStatus.CANCELLED_BY_PROFESSIONAL],
      [JobStatus.ARRIVED]: [JobStatus.DIAGNOSIS],
      [JobStatus.DIAGNOSIS]: [JobStatus.QUOTE_SENT],
      [JobStatus.QUOTE_SENT]: [JobStatus.QUOTE_ACCEPTED, JobStatus.QUOTE_REJECTED],
      [JobStatus.QUOTE_ACCEPTED]: [JobStatus.WORK_IN_PROGRESS],
      [JobStatus.WORK_IN_PROGRESS]: [JobStatus.COMPLETED],
    };

    if (!validTransitions[job.jobStatus]?.includes(newStatus)) {
      throw new BadRequestException('Transition de statut invalide');
    }

    const updateData: Record<string, unknown> = { jobStatus: newStatus };

    // Add timestamps based on status
    switch (newStatus) {
      case JobStatus.EN_ROUTE:
        updateData.enRouteAt = new Date();
        break;
      case JobStatus.ARRIVED:
        updateData.arrivedAt = new Date();
        break;
      case JobStatus.DIAGNOSIS:
        updateData.diagnosisStartedAt = new Date();
        break;
      case JobStatus.WORK_IN_PROGRESS:
        updateData.workStartedAt = new Date();
        break;
      case JobStatus.COMPLETED:
        updateData.workCompletedAt = new Date();
        break;
      case JobStatus.CANCELLED_BY_PROFESSIONAL:
        updateData.cancelledAt = new Date();
        break;
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        request: { include: { address: true } },
      },
    });
  }

  async getById(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        request: { include: { address: true, media: true } },
        customer: {
          select: {
            id: true,
            phone: true,
            customerProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
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
          orderBy: { createdAt: 'desc' },
        },
        jobMedia: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Mission non trouvée');
    }

    return job;
  }
}
