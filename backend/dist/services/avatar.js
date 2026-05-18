"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvatar = exports.saveAvatar = void 0;
const prisma_1 = require("./prisma");
const saveAvatar = async (params) => {
    return prisma_1.prisma.avatar.upsert({
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
exports.saveAvatar = saveAvatar;
const getAvatar = async (userId) => {
    return prisma_1.prisma.avatar.findUnique({
        where: {
            userId,
        },
    });
};
exports.getAvatar = getAvatar;
