import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '@common/prisma/prisma.service';
import { PaymentStatus, PaymentProvider, JobStatus, PayoutStatus, Currency } from '@depan-express/database';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createPaymentIntent(jobId: string, customerId: string) {
    // Get job and quote
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        quotes: {
          where: { status: 'ACCEPTED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!job || job.customerId !== customerId) {
      throw new NotFoundException('Mission non trouvée');
    }

    if (job.jobStatus !== JobStatus.COMPLETED) {
      throw new BadRequestException('La mission doit être terminée pour procéder au paiement');
    }

    const quote = job.quotes[0];
    if (!quote) {
      throw new BadRequestException('Aucun devis accepté trouvé');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.paymentIntent.findFirst({
      where: {
        jobId,
        status: { in: [PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Un paiement existe déjà pour cette mission');
    }

    // Create Stripe PaymentIntent
    const amountInCents = Math.round(Number(quote.totalAmount) * 100);

    const stripePaymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        jobId,
        customerId,
        quoteId: quote.id,
      },
    });

    // Store in database
    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        jobId,
        customerId,
        provider: PaymentProvider.STRIPE,
        providerPaymentIntentId: stripePaymentIntent.id,
        amount: quote.totalAmount,
        currency: Currency.EUR,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: stripePaymentIntent.client_secret,
      amount: quote.totalAmount,
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch (err) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(stripePaymentIntent: Stripe.PaymentIntent) {
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerPaymentIntentId: stripePaymentIntent.id },
      include: { job: true },
    });

    if (!paymentIntent) return;

    await this.prisma.$transaction([
      this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: PaymentStatus.CAPTURED,
          capturedAt: new Date(),
        },
      }),
      // Create invoice
      this.prisma.invoice.create({
        data: {
          jobId: paymentIntent.jobId,
          quoteId: stripePaymentIntent.metadata.quoteId,
          invoiceNumber: `INV-${Date.now()}`,
          subtotalAmount: Number(paymentIntent.amount) / 1.2, // Before VAT
          vatAmount: Number(paymentIntent.amount) - Number(paymentIntent.amount) / 1.2,
          totalAmount: paymentIntent.amount,
          issuedAt: new Date(),
        },
      }),
    ]);

    // Schedule payout to professional (async)
    // TODO: Implement payout scheduling
  }

  private async handlePaymentFailed(stripePaymentIntent: Stripe.PaymentIntent) {
    await this.prisma.paymentIntent.updateMany({
      where: { providerPaymentIntentId: stripePaymentIntent.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  async createPayout(professionalId: string) {
    // Get pending earnings
    const pendingJobs = await this.prisma.job.findMany({
      where: {
        professionalId,
        jobStatus: JobStatus.COMPLETED,
        paymentIntents: {
          some: { status: PaymentStatus.CAPTURED },
        },
      },
      include: {
        paymentIntents: {
          where: { status: PaymentStatus.CAPTURED },
        },
      },
    });

    // TODO: Implement full payout logic with Stripe Connect

    return { success: true };
  }
}
