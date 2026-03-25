import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ApprovalStatus, UserStatus, AuditActionType } from '@depan-express/types';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      totalProfessionals,
      pendingApprovals,
      activeJobs,
      completedJobsToday,
      gmvToday,
      gmvMonth,
      openDisputes,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'PROFESSIONAL', deletedAt: null } }),
      this.prisma.professionalProfile.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.job.count({
        where: { jobStatus: { notIn: ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN'] } },
      }),
      this.prisma.job.count({
        where: { jobStatus: 'COMPLETED', workCompletedAt: { gte: startOfDay } },
      }),
      this.prisma.paymentIntent.aggregate({
        where: { status: 'CAPTURED', capturedAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      this.prisma.paymentIntent.aggregate({
        where: { status: 'CAPTURED', capturedAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.dispute.count({ where: { status: { in: ['OPENED', 'UNDER_REVIEW'] } } }),
    ]);

    return {
      totalCustomers,
      totalProfessionals,
      pendingApprovals,
      activeJobs,
      completedJobsToday,
      gmvToday: gmvToday._sum.amount || 0,
      gmvMonth: gmvMonth._sum.amount || 0,
      openDisputes,
    };
  }

  // ============================================================
  // CUSTOMERS
  // ============================================================

  async getCustomers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { customerProfile: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { customerProfile: { lastName: { contains: search, mode: 'insensitive' as const } } },
          ],
          role: 'CUSTOMER' as const,
          deletedAt: null,
        }
      : { role: 'CUSTOMER' as const, deletedAt: null };

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { customerProfile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: customers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // PROFESSIONALS
  // ============================================================

  async getProfessionals(page = 1, limit = 20, status?: ApprovalStatus) {
    const skip = (page - 1) * limit;

    const where = {
      role: 'PROFESSIONAL' as const,
      deletedAt: null,
      ...(status && { professionalProfile: { approvalStatus: status } }),
    };

    const [professionals, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          professionalProfile: {
            include: {
              documents: true,
              specialties: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: professionals,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveProfessional(professionalUserId: string, adminUserId: string) {
    const professional = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
    });

    if (!professional) {
      throw new NotFoundException('Professionnel non trouvé');
    }

    await this.prisma.$transaction([
      this.prisma.professionalProfile.update({
        where: { userId: professionalUserId },
        data: {
          approvalStatus: ApprovalStatus.APPROVED,
          approvedAt: new Date(),
          isKycVerified: true,
        },
      }),
      this.prisma.user.update({
        where: { id: professionalUserId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: adminUserId,
          entityType: 'ProfessionalProfile',
          entityId: professional.id,
          actionType: AuditActionType.APPROVAL,
          newValue: { approvalStatus: 'APPROVED' },
        },
      }),
    ]);

    return { success: true };
  }

  async rejectProfessional(professionalUserId: string, adminUserId: string, reason: string) {
    const professional = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
    });

    if (!professional) {
      throw new NotFoundException('Professionnel non trouvé');
    }

    await this.prisma.$transaction([
      this.prisma.professionalProfile.update({
        where: { userId: professionalUserId },
        data: { approvalStatus: ApprovalStatus.REJECTED },
      }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: adminUserId,
          entityType: 'ProfessionalProfile',
          entityId: professional.id,
          actionType: AuditActionType.REJECTION,
          newValue: { approvalStatus: 'REJECTED', reason },
        },
      }),
    ]);

    return { success: true };
  }

  // ============================================================
  // ACCOUNT MANAGEMENT
  // ============================================================

  async suspendAccount(userId: string, adminUserId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.SUSPENDED },
      }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: adminUserId,
          entityType: 'User',
          entityId: userId,
          actionType: AuditActionType.SUSPENSION,
          oldValue: { status: user.status },
          newValue: { status: 'SUSPENDED', reason },
        },
      }),
    ]);

    return { success: true };
  }

  async reactivateAccount(userId: string, adminUserId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: adminUserId,
          entityType: 'User',
          entityId: userId,
          actionType: AuditActionType.STATUS_CHANGE,
          newValue: { status: 'ACTIVE' },
        },
      }),
    ]);

    return { success: true };
  }

  // ============================================================
  // JOBS
  // ============================================================

  async getJobs(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where = status ? { jobStatus: status as any } : {};

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          request: { include: { address: true } },
          customer: {
            select: { customerProfile: { select: { firstName: true, lastName: true } } },
          },
          professional: {
            select: { professionalProfile: { select: { firstName: true, lastName: true, businessName: true } } },
          },
          quotes: { where: { status: { in: ['SENT', 'ACCEPTED'] } }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: jobs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // DISPUTES
  // ============================================================

  async getDisputes(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          job: {
            include: {
              customer: { select: { customerProfile: { select: { firstName: true, lastName: true } } } },
              professional: { select: { professionalProfile: { select: { firstName: true, lastName: true } } } },
            },
          },
          evidences: true,
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      items: disputes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  async getAuditLogs(page = 1, limit = 50, entityType?: string) {
    const skip = (page - 1) * limit;

    const where = entityType ? { entityType } : {};

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
