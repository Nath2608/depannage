import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UpdateCustomerProfileDto, CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // PROFILE
  // ============================================================

  async getProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: true,
          },
        },
        defaultAddress: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil client non trouvé');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateCustomerProfileDto) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profil client non trouvé');
    }

    return this.prisma.customerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  // ============================================================
  // ADDRESSES
  // ============================================================

  async getAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette adresse');
    }

    return address;
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    // If this is the first address or marked as default, update other addresses
    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.userAddress.create({
      data: {
        userId,
        label: dto.label,
        streetLine1: dto.streetLine1,
        streetLine2: dto.streetLine2,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country || 'FR',
        latitude: dto.latitude,
        longitude: dto.longitude,
        accessNotes: dto.accessNotes,
        isDefault: dto.isDefault || false,
      },
    });

    // Update customer profile default address if needed
    if (dto.isDefault) {
      await this.prisma.customerProfile.update({
        where: { userId },
        data: { defaultAddressId: address.id },
      });
    }

    return address;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const existing = await this.getAddress(userId, addressId);

    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      await this.prisma.customerProfile.update({
        where: { userId },
        data: { defaultAddressId: addressId },
      });
    }

    return this.prisma.userAddress.update({
      where: { id: addressId },
      data: {
        label: dto.label,
        streetLine1: dto.streetLine1,
        streetLine2: dto.streetLine2,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accessNotes: dto.accessNotes,
        isDefault: dto.isDefault,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.getAddress(userId, addressId);

    // If deleting default address, clear the reference
    if (address.isDefault) {
      await this.prisma.customerProfile.update({
        where: { userId },
        data: { defaultAddressId: null },
      });
    }

    await this.prisma.userAddress.delete({
      where: { id: addressId },
    });

    return { success: true };
  }

  // ============================================================
  // SERVICE REQUESTS HISTORY
  // ============================================================

  async getServiceRequests(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where: { customerId: userId },
        include: {
          address: true,
          job: {
            include: {
              professional: {
                select: {
                  id: true,
                  email: true,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceRequest.count({
        where: { customerId: userId },
      }),
    ]);

    return {
      items: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // INVOICES
  // ============================================================

  async getInvoices(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          job: { customerId: userId },
        },
        include: {
          job: {
            select: {
              id: true,
              request: {
                select: {
                  requestedTrade: true,
                  problemCategory: true,
                },
              },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({
        where: {
          job: { customerId: userId },
        },
      }),
    ]);

    return {
      items: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
