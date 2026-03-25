import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { QuoteStatus, JobStatus, QuoteItemType } from '@depan-express/database';

interface CreateQuoteDto {
  jobId: string;
  items: {
    itemType: QuoteItemType;
    label: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(professionalUserId: string, dto: CreateQuoteDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job || job.professionalId !== professionalUserId) {
      throw new NotFoundException('Mission non trouvée');
    }

    if (job.jobStatus !== JobStatus.DIAGNOSIS) {
      throw new BadRequestException('Impossible de créer un devis dans cet état');
    }

    // Calculate totals
    let travelFee = 0;
    let laborFee = 0;
    let partsFee = 0;
    let surchargeFee = 0;

    const items = dto.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;

      switch (item.itemType) {
        case QuoteItemType.TRAVEL:
          travelFee += totalPrice;
          break;
        case QuoteItemType.LABOR:
          laborFee += totalPrice;
          break;
        case QuoteItemType.PARTS:
          partsFee += totalPrice;
          break;
        default:
          if (item.itemType.startsWith('SURCHARGE')) {
            surchargeFee += totalPrice;
          }
      }

      return {
        ...item,
        totalPrice,
      };
    });

    const subtotal = travelFee + laborFee + partsFee + surchargeFee;
    const vatRate = 0.2; // 20% TVA
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    const professionalProfile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
    });

    if (!professionalProfile) {
      throw new NotFoundException('Profil professionnel non trouvé');
    }

    const quote = await this.prisma.quote.create({
      data: {
        jobId: dto.jobId,
        professionalId: professionalProfile.id,
        customerId: job.customerId,
        status: QuoteStatus.DRAFT,
        travelFee,
        laborFee,
        partsFee,
        surchargeFee,
        vatAmount,
        totalAmount,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    return quote;
  }

  async send(quoteId: string, professionalUserId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { professional: true },
    });

    if (!quote || quote.professional.userId !== professionalUserId) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Ce devis a déjà été envoyé');
    }

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.SENT,
          sentAt: new Date(),
        },
      }),
      this.prisma.job.update({
        where: { id: quote.jobId },
        data: { jobStatus: JobStatus.QUOTE_SENT },
      }),
    ]);

    return { success: true };
  }

  async accept(quoteId: string, customerId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote || quote.customerId !== customerId) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('Ce devis ne peut pas être accepté');
    }

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.job.update({
        where: { id: quote.jobId },
        data: { jobStatus: JobStatus.QUOTE_ACCEPTED },
      }),
    ]);

    return { success: true };
  }

  async reject(quoteId: string, customerId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote || quote.customerId !== customerId) {
      throw new NotFoundException('Devis non trouvé');
    }

    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('Ce devis ne peut pas être refusé');
    }

    await this.prisma.$transaction([
      this.prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: QuoteStatus.REJECTED,
          rejectedAt: new Date(),
        },
      }),
      this.prisma.job.update({
        where: { id: quote.jobId },
        data: { jobStatus: JobStatus.QUOTE_REJECTED },
      }),
    ]);

    return { success: true };
  }
}
