"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const gemini_1 = require("../services/gemini");
const http_1 = require("../lib/http");
const router = (0, express_1.Router)();
const schema = zod_1.z.object({
    imageBase64: zod_1.z.string().min(1),
});
router.post('/validate-photo', (0, http_1.asyncHandler)(async (req, res) => {
    console.log('[validate] /validate-photo called (body keys):', Object.keys(req.body));
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return (0, http_1.sendError)(res, 400, 'bad_request', 'imageBase64 is required');
    }
    const result = await (0, gemini_1.validatePhoto)(parsed.data.imageBase64);
    if (!result.valid) {
        return (0, http_1.sendError)(res, 400, result.code ?? 'invalid_photo', result.reason || 'Photo validation failed', {
            issues: result.issues,
            poseWarning: result.poseWarning,
            poseMessage: result.poseMessage,
        });
    }
    return res.status(200).json({
        success: true,
        data: result,
    });
}));
exports.default = router;
