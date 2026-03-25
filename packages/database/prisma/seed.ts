import {
  PrismaClient,
  UserRole,
  UserStatus,
  TradeType,
  CompanyType,
  ApprovalStatus,
  UrgencyType,
  DayOfWeek,
  ProblemCategory,
  ServiceRequestStatus,
  JobStatus,
  QuoteStatus,
  QuoteItemType,
  PaymentStatus,
  PaymentProvider,
  Currency,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Password hash using Argon2id (production-ready)
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.disputeEvidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.jobMedia.deleteMany();
  await prisma.job.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.serviceRequestMedia.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.professionalBankAccount.deleteMany();
  await prisma.professionalDocument.deleteMany();
  await prisma.professionalAvailability.deleteMany();
  await prisma.professionalServiceArea.deleteMany();
  await prisma.professionalSpecialty.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.serviceZone.deleteMany();
  await prisma.platformConfig.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@depan-express.fr',
      phone: '+33600000001',
      passwordHash: await hashPassword('Admin123!'),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log('👤 Created admin user:', adminUser.email);

  // Create Support user
  const supportUser = await prisma.user.create({
    data: {
      email: 'support@depan-express.fr',
      phone: '+33600000002',
      passwordHash: await hashPassword('Support123!'),
      role: UserRole.SUPPORT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });
  console.log('👤 Created support user:', supportUser.email);

  // Create Customer users
  const customerPassword = await hashPassword('Customer123!');
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'jean.dupont@email.com',
        phone: '+33612345678',
        passwordHash: customerPassword,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        customerProfile: {
          create: {
            firstName: 'Jean',
            lastName: 'Dupont',
            preferredLanguage: 'fr',
            marketingConsent: true,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
          },
        },
      },
      include: { customerProfile: true },
    }),
    prisma.user.create({
      data: {
        email: 'marie.martin@email.com',
        phone: '+33687654321',
        passwordHash: customerPassword,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        customerProfile: {
          create: {
            firstName: 'Marie',
            lastName: 'Martin',
            preferredLanguage: 'fr',
            marketingConsent: false,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
          },
        },
      },
      include: { customerProfile: true },
    }),
  ]);
  console.log('👤 Created', customers.length, 'customer users');

  // Create addresses for customers
  const address1 = await prisma.userAddress.create({
    data: {
      userId: customers[0]!.id,
      label: 'Domicile',
      streetLine1: '15 Rue de la Paix',
      postalCode: '75002',
      city: 'Paris',
      country: 'FR',
      latitude: 48.8698,
      longitude: 2.3298,
      isDefault: true,
    },
  });

  const address2 = await prisma.userAddress.create({
    data: {
      userId: customers[1]!.id,
      label: 'Appartement',
      streetLine1: '8 Avenue des Champs-Élysées',
      postalCode: '75008',
      city: 'Paris',
      country: 'FR',
      latitude: 48.8697,
      longitude: 2.3075,
      accessNotes: 'Digicode: 1234, 3ème étage gauche',
      isDefault: true,
    },
  });
  console.log('📍 Created customer addresses');

  // Update default addresses
  await prisma.customerProfile.update({
    where: { userId: customers[0]!.id },
    data: { defaultAddressId: address1.id },
  });

  await prisma.customerProfile.update({
    where: { userId: customers[1]!.id },
    data: { defaultAddressId: address2.id },
  });

  // Create Professional users
  const proPassword = await hashPassword('Pro123!');
  const plumber = await prisma.user.create({
    data: {
      email: 'paul.plombier@artisan.fr',
      phone: '+33698765432',
      passwordHash: proPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      professionalProfile: {
        create: {
          businessName: 'Plomberie Paul',
          firstName: 'Paul',
          lastName: 'Leroy',
          tradeType: TradeType.PLUMBING,
          companyType: CompanyType.AUTO_ENTREPRENEUR,
          siret: '12345678901234',
          yearsOfExperience: 15,
          bio: 'Plombier expérimenté avec 15 ans de métier. Spécialisé dans les urgences et dépannages rapides.',
          ratingAvg: 4.8,
          ratingCount: 127,
          jobCount: 156,
          isKycVerified: true,
          isBackgroundChecked: true,
          isActiveForDispatch: true,
          approvalStatus: ApprovalStatus.APPROVED,
          approvedAt: new Date(),
          specialties: {
            create: [
              { specialtyCode: 'LEAK_REPAIR' },
              { specialtyCode: 'PIPE_UNCLOGGING' },
              { specialtyCode: 'WATER_HEATER' },
              { specialtyCode: 'EMERGENCY_SHUTOFF' },
            ],
          },
          serviceAreas: {
            create: {
              city: 'Paris',
              postalCode: '75000',
              radiusKm: 15,
              latitude: 48.8566,
              longitude: 2.3522,
            },
          },
          availability: {
            create: [
              { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '19:00', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.TUESDAY, startTime: '08:00', endTime: '19:00', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '19:00', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.THURSDAY, startTime: '08:00', endTime: '19:00', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.FRIDAY, startTime: '08:00', endTime: '19:00', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.SATURDAY, startTime: '09:00', endTime: '17:00', isEmergencySlot: false },
            ],
          },
        },
      },
    },
    include: { professionalProfile: true },
  });
  console.log('🔧 Created plumber:', plumber.email);

  const locksmith = await prisma.user.create({
    data: {
      email: 'sarah.serrurier@artisan.fr',
      phone: '+33611223344',
      passwordHash: proPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
      professionalProfile: {
        create: {
          businessName: 'Serrurerie Express',
          firstName: 'Sarah',
          lastName: 'Bernard',
          tradeType: TradeType.LOCKSMITH,
          companyType: CompanyType.SASU,
          siret: '98765432109876',
          vatNumber: 'FR12345678901',
          insurancePolicyNumber: 'INS-2024-001',
          insuranceExpiryDate: new Date('2025-12-31'),
          yearsOfExperience: 8,
          bio: 'Serrurier agréée assurance. Intervention rapide 24h/24 pour ouverture de porte, changement de serrure.',
          ratingAvg: 4.9,
          ratingCount: 89,
          jobCount: 102,
          isKycVerified: true,
          isBackgroundChecked: true,
          isActiveForDispatch: true,
          approvalStatus: ApprovalStatus.APPROVED,
          approvedAt: new Date(),
          specialties: {
            create: [
              { specialtyCode: 'DOOR_OPENING' },
              { specialtyCode: 'LOCK_CHANGE' },
              { specialtyCode: 'LOCK_REPAIR' },
              { specialtyCode: 'EMERGENCY_LOCKOUT' },
            ],
          },
          serviceAreas: {
            create: {
              city: 'Paris',
              postalCode: '75000',
              radiusKm: 20,
              latitude: 48.8566,
              longitude: 2.3522,
            },
          },
          availability: {
            create: [
              { dayOfWeek: DayOfWeek.MONDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.TUESDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.THURSDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.FRIDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.SATURDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
              { dayOfWeek: DayOfWeek.SUNDAY, startTime: '00:00', endTime: '23:59', isEmergencySlot: true },
            ],
          },
        },
      },
    },
    include: { professionalProfile: true },
  });
  console.log('🔐 Created locksmith:', locksmith.email);

  // Create pending professional
  await prisma.user.create({
    data: {
      email: 'pending.pro@artisan.fr',
      phone: '+33655443322',
      passwordHash: proPassword,
      role: UserRole.PROFESSIONAL,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: true,
      isPhoneVerified: false,
      professionalProfile: {
        create: {
          businessName: 'Plomberie Express',
          firstName: 'Marc',
          lastName: 'Dubois',
          tradeType: TradeType.PLUMBING,
          companyType: CompanyType.EURL,
          siret: '55544433322211',
          yearsOfExperience: 5,
          approvalStatus: ApprovalStatus.PENDING,
        },
      },
    },
  });
  console.log('⏳ Created pending professional');

  // Create Service Zones
  await prisma.serviceZone.createMany({
    data: [
      {
        name: 'Paris Centre',
        postalCodes: ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010'],
        isActive: true,
      },
      {
        name: 'Paris Est',
        postalCodes: ['75011', '75012', '75019', '75020'],
        isActive: true,
      },
      {
        name: 'Paris Ouest',
        postalCodes: ['75015', '75016', '75017'],
        isActive: true,
      },
      {
        name: 'Paris Sud',
        postalCodes: ['75013', '75014'],
        isActive: true,
      },
      {
        name: 'Paris Nord',
        postalCodes: ['75018'],
        isActive: true,
      },
    ],
  });
  console.log('🗺️ Created service zones');

  // Create Pricing Rules
  await prisma.pricingRule.createMany({
    data: [
      {
        tradeType: TradeType.PLUMBING,
        urgencyType: UrgencyType.EMERGENCY,
        basePrice: 89.00,
        pricePerKm: 2.50,
        nightSurcharge: 50.00,
        weekendSurcharge: 30.00,
        holidaySurcharge: 50.00,
        vatRate: 10.00,
        platformFeeRate: 15.00,
        isActive: true,
      },
      {
        tradeType: TradeType.PLUMBING,
        urgencyType: UrgencyType.SCHEDULED,
        basePrice: 59.00,
        pricePerKm: 2.00,
        nightSurcharge: 0.00,
        weekendSurcharge: 20.00,
        holidaySurcharge: 30.00,
        vatRate: 10.00,
        platformFeeRate: 15.00,
        isActive: true,
      },
      {
        tradeType: TradeType.LOCKSMITH,
        urgencyType: UrgencyType.EMERGENCY,
        basePrice: 99.00,
        pricePerKm: 3.00,
        nightSurcharge: 80.00,
        weekendSurcharge: 50.00,
        holidaySurcharge: 80.00,
        vatRate: 20.00,
        platformFeeRate: 15.00,
        isActive: true,
      },
      {
        tradeType: TradeType.LOCKSMITH,
        urgencyType: UrgencyType.SCHEDULED,
        basePrice: 69.00,
        pricePerKm: 2.50,
        nightSurcharge: 0.00,
        weekendSurcharge: 30.00,
        holidaySurcharge: 50.00,
        vatRate: 20.00,
        platformFeeRate: 15.00,
        isActive: true,
      },
    ],
  });
  console.log('💰 Created pricing rules');

  // Create Platform Config
  await prisma.platformConfig.createMany({
    data: [
      {
        key: 'dispatch_timeout_seconds',
        value: 120,
      },
      {
        key: 'max_dispatch_attempts',
        value: 5,
      },
      {
        key: 'quote_expiry_hours',
        value: 24,
      },
      {
        key: 'dispute_opening_days',
        value: 7,
      },
      {
        key: 'min_rating_for_dispatch',
        value: 3.5,
      },
      {
        key: 'max_failed_login_attempts',
        value: 5,
      },
      {
        key: 'account_lock_duration_minutes',
        value: 30,
      },
    ],
  });
  console.log('⚙️ Created platform config');

  // ===========================================
  // DEMO DATA: Service Requests, Jobs, Quotes
  // ===========================================

  // Completed job with review (plumbing)
  const serviceRequest1 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0]!.id,
      requestedTrade: TradeType.PLUMBING,
      problemCategory: ProblemCategory.WATER_LEAK,
      urgencyType: UrgencyType.EMERGENCY,
      addressId: address1.id,
      description: 'Fuite d\'eau importante sous l\'évier de la cuisine. L\'eau coule constamment.',
      accessNotes: 'Sonnez à l\'interphone, je descends ouvrir.',
      status: ServiceRequestStatus.ASSIGNED,
      estimatedPriceMin: 89,
      estimatedPriceMax: 250,
      estimatedEtaMinutes: 30,
    },
  });

  const job1 = await prisma.job.create({
    data: {
      requestId: serviceRequest1.id,
      customerId: customers[0]!.id,
      professionalId: plumber.id,
      jobStatus: JobStatus.COMPLETED,
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      enRouteAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
      diagnosisStartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      workCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 110 * 60 * 1000),
    },
  });

  const quote1 = await prisma.quote.create({
    data: {
      jobId: job1.id,
      professionalId: plumber.professionalProfile!.id,
      customerId: customers[0]!.id,
      status: QuoteStatus.ACCEPTED,
      travelFee: 15,
      laborFee: 89,
      partsFee: 45.50,
      surchargeFee: 0,
      vatAmount: 14.95,
      totalAmount: 164.45,
      currency: Currency.EUR,
      notes: 'Remplacement du joint du siphon et resserrage des raccords.',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 48 * 60 * 1000),
      items: {
        create: [
          { itemType: QuoteItemType.TRAVEL, label: 'Déplacement', quantity: 1, unitPrice: 15, totalPrice: 15 },
          { itemType: QuoteItemType.LABOR, label: 'Main d\'œuvre (1h)', quantity: 1, unitPrice: 89, totalPrice: 89 },
          { itemType: QuoteItemType.PARTS, label: 'Joint siphon', quantity: 1, unitPrice: 12.50, totalPrice: 12.50 },
          { itemType: QuoteItemType.PARTS, label: 'Raccords cuivre', quantity: 2, unitPrice: 16.50, totalPrice: 33 },
        ],
      },
    },
  });

  // Payment for job 1
  await prisma.paymentIntent.create({
    data: {
      jobId: job1.id,
      customerId: customers[0]!.id,
      provider: PaymentProvider.STRIPE,
      providerPaymentIntentId: 'pi_demo_12345678',
      amount: 164.45,
      currency: Currency.EUR,
      status: PaymentStatus.CAPTURED,
      authorizedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 48 * 60 * 1000),
      capturedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 110 * 60 * 1000),
    },
  });

  // Review for job 1
  await prisma.review.create({
    data: {
      jobId: job1.id,
      customerId: customers[0]!.id,
      professionalId: plumber.id,
      rating: 5,
      comment: 'Excellent travail ! Paul est arrivé rapidement et a résolu le problème efficacement. Je recommande vivement.',
    },
  });
  console.log('✅ Created completed plumbing job with review');

  // Completed locksmith job
  const serviceRequest2 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[1]!.id,
      requestedTrade: TradeType.LOCKSMITH,
      problemCategory: ProblemCategory.LOCKED_OUT,
      urgencyType: UrgencyType.EMERGENCY,
      addressId: address2.id,
      description: 'Porte claquée, clés restées à l\'intérieur. Besoin d\'une ouverture de porte urgente.',
      status: ServiceRequestStatus.ASSIGNED,
      estimatedPriceMin: 99,
      estimatedPriceMax: 180,
      estimatedEtaMinutes: 20,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      requestId: serviceRequest2.id,
      customerId: customers[1]!.id,
      professionalId: locksmith.id,
      jobStatus: JobStatus.COMPLETED,
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      enRouteAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000),
      diagnosisStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000),
      workCompletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
    },
  });

  await prisma.quote.create({
    data: {
      jobId: job2.id,
      professionalId: locksmith.professionalProfile!.id,
      customerId: customers[1]!.id,
      status: QuoteStatus.ACCEPTED,
      travelFee: 20,
      laborFee: 99,
      partsFee: 0,
      surchargeFee: 0,
      vatAmount: 23.80,
      totalAmount: 142.80,
      currency: Currency.EUR,
      notes: 'Ouverture de porte sans dégradation.',
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 21 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000),
      items: {
        create: [
          { itemType: QuoteItemType.TRAVEL, label: 'Déplacement', quantity: 1, unitPrice: 20, totalPrice: 20 },
          { itemType: QuoteItemType.LABOR, label: 'Ouverture de porte', quantity: 1, unitPrice: 99, totalPrice: 99 },
        ],
      },
    },
  });

  await prisma.paymentIntent.create({
    data: {
      jobId: job2.id,
      customerId: customers[1]!.id,
      provider: PaymentProvider.STRIPE,
      providerPaymentIntentId: 'pi_demo_87654321',
      amount: 142.80,
      currency: Currency.EUR,
      status: PaymentStatus.CAPTURED,
      authorizedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000),
      capturedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job2.id,
      customerId: customers[1]!.id,
      professionalId: locksmith.id,
      rating: 5,
      comment: 'Sarah est intervenue très rapidement. Porte ouverte en 10 minutes sans aucun dégât. Parfait !',
    },
  });
  console.log('✅ Created completed locksmith job with review');

  // Job in progress (plumber en route)
  const serviceRequest3 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0]!.id,
      requestedTrade: TradeType.PLUMBING,
      problemCategory: ProblemCategory.CLOGGED_DRAIN,
      urgencyType: UrgencyType.EMERGENCY,
      addressId: address1.id,
      description: 'Toilettes bouchées depuis ce matin. L\'eau ne s\'évacue plus du tout.',
      status: ServiceRequestStatus.ASSIGNED,
      estimatedPriceMin: 89,
      estimatedPriceMax: 200,
      estimatedEtaMinutes: 25,
    },
  });

  await prisma.job.create({
    data: {
      requestId: serviceRequest3.id,
      customerId: customers[0]!.id,
      professionalId: plumber.id,
      jobStatus: JobStatus.EN_ROUTE,
      acceptedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      enRouteAt: new Date(Date.now() - 8 * 60 * 1000),
    },
  });
  console.log('🚗 Created in-progress job (en route)');

  // Pending service request (waiting for professional)
  await prisma.serviceRequest.create({
    data: {
      customerId: customers[1]!.id,
      requestedTrade: TradeType.PLUMBING,
      problemCategory: ProblemCategory.NO_HOT_WATER,
      urgencyType: UrgencyType.SCHEDULED,
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      addressId: address2.id,
      description: 'Plus d\'eau chaude depuis hier soir. Le chauffe-eau ne semble pas fonctionner.',
      status: ServiceRequestStatus.SUBMITTED,
      estimatedPriceMin: 59,
      estimatedPriceMax: 350,
    },
  });
  console.log('📝 Created pending service request');

  // Invoice for completed job
  await prisma.invoice.create({
    data: {
      jobId: job1.id,
      quoteId: quote1.id,
      invoiceNumber: 'INV-2024-0001',
      subtotalAmount: 149.50,
      vatAmount: 14.95,
      totalAmount: 164.45,
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 110 * 60 * 1000),
    },
  });
  console.log('📄 Created invoice');

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('Admin: admin@depan-express.fr / Admin123!');
  console.log('Support: support@depan-express.fr / Support123!');
  console.log('Customer 1: jean.dupont@email.com / Customer123!');
  console.log('Customer 2: marie.martin@email.com / Customer123!');
  console.log('Plumber: paul.plombier@artisan.fr / Pro123!');
  console.log('Locksmith: sarah.serrurier@artisan.fr / Pro123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
