"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const cloudinary_1 = require("../services/cloudinary");
const avatar_1 = require("../services/avatar");
const http_1 = require("../lib/http");
const router = (0, express_1.Router)();
const processSchema = zod_1.z.object({
    publicId: zod_1.z.string().min(1),
});
const saveSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    originalUrl: zod_1.z.string().url(),
    processedUrl: zod_1.z.string().url(),
});
router.post('/process-avatar', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[avatar] /process-avatar called with body:', req.body);
    const parsed = processSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'publicId is required');
    }
    const processed = await (0, cloudinary_1.processCloudinaryImage)(parsed.data.publicId, 'avatars/processed', [
        'background_removal',
        'improve:indoor:50',
        'sharpen:40',
        'auto_brightness',
    ]);
    return res.status(200).json({
        success: true,
        data: {
            original_url: processed.originalUrl,
            processed_url: processed.processedUrl,
        },
    });
}));
router.post('/avatar/save', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[avatar] /avatar/save called with body:', req.body);
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'userId, originalUrl, and processedUrl are required');
    }
    const avatar = await (0, avatar_1.saveAvatar)(parsed.data);
    return res.status(200).json({
        success: true,
        data: avatar,
    });
}));
router.get('/avatar', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[avatar] GET /avatar called, query:', req.query);
    const userId = zod_1.z.string().min(1).safeParse(req.query.userId);
    if (!userId.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'userId query parameter is required');
    }
    const avatar = await (0, avatar_1.getAvatar)(userId.data);
    if (!avatar) {
        return (0, http_1.sendError)(res, 404, 'avatar_not_found', 'No saved avatar was found for this user');
    }
    return res.status(200).json({
        success: true,
        data: avatar,
    });
}));
exports.default = router;
