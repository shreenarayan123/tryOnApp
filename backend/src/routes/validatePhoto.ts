import {Router} from 'express';
import {z} from 'zod';
import {validatePhoto} from '../services/gemini';
import {asyncHandler, sendError} from '../lib/http';

const router = Router();

const schema = z.object({
  imageBase64: z.string().min(1),
});

router.post(
  '/validate-photo',
  asyncHandler(async (req, res) => {
    console.log('[validate] /validate-photo called (body keys):', Object.keys(req.body));
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'bad_request', 'imageBase64 is required');
    }

    const result = await validatePhoto(parsed.data.imageBase64);

    if (!result.valid) {
      return sendError(res, 400, result.code ?? 'invalid_photo', result.reason || 'Photo validation failed', {
        issues: result.issues,
        poseWarning: result.poseWarning,
        poseMessage: result.poseMessage,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),
);

export default router;
