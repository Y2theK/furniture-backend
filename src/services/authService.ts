import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserByPhone = async (phone: string) => {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  });
};

export const getUserById = async (id: number) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const createUser = async (userData: any) => {
  return prisma.user.create({
    data: userData,
  });
};

export const updateUser = async (id: number, userData: any) => {
  return prisma.user.update({
    where: { id },
    data: userData,
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
