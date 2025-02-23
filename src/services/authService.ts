import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserByPhone = async (phone: string) => {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  });
};

export const createOTP = async (otpData: any) => {
  return prisma.otp.create({
    data: otpData,
  });
};

export const updateOTP = async (id: number, otpData: any) => {
  return prisma.otp.update({
    where: { id },
    data: otpData,
  });
};

export const getOtpByPhone = async (phone: string) => {
  return prisma.otp.findUnique({
    where: {
      phone,
    },
  });
};
