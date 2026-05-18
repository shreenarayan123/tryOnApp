import {prisma} from './prisma';

export const saveAvatar = async (params: {
  userId: string;
  originalUrl: string;
  processedUrl: string;
}) => {
  return prisma.avatar.upsert({
    where: {
      userId: params.userId,
    },
    create: params,
    update: {
      originalUrl: params.originalUrl,
      processedUrl: params.processedUrl,
    },
  });
};

export const getAvatar = async (userId: string) => {
  return prisma.avatar.findUnique({
    where: {
      userId,
    },
  });
};
