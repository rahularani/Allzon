import { prisma } from '../../config/database';
import { conflict, notFound } from '../../middleware/error.middleware';
import type { CreateBuyerProfileInput, UpdateBuyerProfileInput } from './buyers.schema';

export async function createBuyerProfileService(
  userId: string,
  input: CreateBuyerProfileInput,
) {
  const existing = await prisma.buyerProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw conflict('Buyer profile already exists for this account');
  }

  const profile = await prisma.buyerProfile.create({
    data: {
      userId,
      fullName: input.fullName,
      businessName: input.businessName,
      businessType: input.businessType,
      phone: input.phone,
      email: input.email,
      city: input.city,
      state: input.state,
    },
  });

  return profile;
}

export async function getBuyerProfileService(userId: string) {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw notFound('Buyer profile not found');
  }

  return profile;
}

export async function updateBuyerProfileService(
  userId: string,
  input: UpdateBuyerProfileInput,
) {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw notFound('Buyer profile not found');
  }

  const updated = await prisma.buyerProfile.update({
    where: { userId },
    data: input,
  });

  return updated;
}
