"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const http_1 = require("../lib/http");
const vertex_1 = require("../services/vertex");
const types_1 = require("../types");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("../services/cloudinary");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    avatarUrl: zod_1.z.string().url(),
    garmentUrl: zod_1.z.string().url(),
    garmentType: zod_1.z.enum(types_1.GARMENT_TYPES),
});
router.post('/tryon/generate', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[tryon] /tryon/generate request body:', req.body);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'avatarUrl, garmentUrl, and garmentType are required');
    }
    try {
        const result = await (0, vertex_1.generateTryOnImage)(parsed.data);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        if (error instanceof http_1.ApiError) {
            return (0, http_1.sendError)(res, error.statusCode, error.code, error.message, error.details);
        }
        throw error;
    }
}));
exports.default = router;
// Support legacy mobile client: multipart POST /api/tryon with `avatar` and `garment` files
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/tryon', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'garment', maxCount: 1 }]), (0, http_1.asyncHandler)(async (req, res) => {
    // multer puts files on req.files
    const files = req.files;
    const avatarFile = files?.avatar?.[0];
    const garmentFile = files?.garment?.[0];
    console.log('[tryon] multipart /tryon called; files present:', {
        avatar: Boolean(avatarFile),
        garment: Boolean(garmentFile),
        avatarSize: avatarFile ? avatarFile.size : undefined,
        garmentSize: garmentFile ? garmentFile.size : undefined,
        contentType: req.headers['content-type'],
    });
    if (!avatarFile || !garmentFile) {
        console.log('[tryon] missing files in multipart request');
        return res.status(400).json({ success: false, error: 'Missing avatar or garment file' });
    }
    // Upload both to Cloudinary
    const avatarUpload = await (0, cloudinary_1.uploadBufferToCloudinary)(avatarFile.buffer, 'avatars', `avatar-${Date.now()}`);
    console.log('[tryon] avatar uploaded to cloudinary:', avatarUpload.secure_url);
    const garmentUpload = await (0, cloudinary_1.uploadBufferToCloudinary)(garmentFile.buffer, 'garments', `garment-${Date.now()}`);
    console.log('[tryon] garment uploaded to cloudinary:', garmentUpload.secure_url);
    try {
        const start = Date.now();
        const result = await (0, vertex_1.generateTryOnImage)({
            avatarUrl: avatarUpload.secure_url,
            garmentUrl: garmentUpload.secure_url,
            garmentType: 'other',
        });
        return res.status(200).json({
            success: true,
            resultUrl: result.resultUrl,
            processingTime: Date.now() - start,
        });
    }
    catch (error) {
        if (error instanceof http_1.ApiError) {
            return res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
        }
        throw error;
    }
}));
