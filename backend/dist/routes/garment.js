"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const cloudinary_1 = require("../services/cloudinary");
const gemini_1 = require("../services/gemini");
const http_1 = require("../lib/http");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    publicId: zod_1.z.string().min(1),
});
router.post('/process-garment', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[garment] /process-garment called with body:', req.body);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'publicId is required');
    }
    const [processed, garment] = await Promise.all([
        (0, cloudinary_1.processCloudinaryImage)(parsed.data.publicId, 'garments/processed', [
            'background_removal',
            'improve:80',
            'sharpen:60',
            'vibrance:40',
        ]),
        (0, gemini_1.detectGarmentType)(parsed.data.publicId),
    ]);
    return res.status(200).json({
        success: true,
        data: {
            processed_url: processed.processedUrl,
            original_url: processed.originalUrl,
            garment_type: garment,
        },
    });
}));
exports.default = router;
