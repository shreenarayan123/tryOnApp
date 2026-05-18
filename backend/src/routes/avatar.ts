import {Router} from 'express';
import {z} from 'zod';
import {processCloudinaryImage} from '../services/cloudinary';
import {getAvatar, saveAvatar} from '../services/avatar';
import {asyncHandler, sendError} from '../lib/http';

const router = Router();

const processSchema = z.object({
  publicId: z.string().min(1),
});

const saveSchema = z.object({
  userId: z.string().min(1),
  originalUrl: z.string().url(),
  processedUrl: z.string().url(),
});

router.post(
  '/process-avatar',
  asyncHandler(async (req, res) => {
    console.log('[avatar] /process-avatar called with body:', req.body);
    const parsed = processSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'bad_request', 'publicId is required');
    }

    const processed = await processCloudinaryImage(parsed.data.publicId, 'avatars/processed', [
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
  }),
);

router.post(
  '/avatar/save',
  asyncHandler(async (req, res) => {
    console.log('[avatar] /avatar/save called with body:', req.body);
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'bad_request', 'userId, originalUrl, and processedUrl are required');
    }

    const avatar = await saveAvatar(parsed.data);
    return res.status(200).json({
      success: true,
      data: avatar,
    });
  }),
);

router.get(
  '/avatar',
  asyncHandler(async (req, res) => {
    console.log('[avatar] GET /avatar called, query:', req.query);
    const userId = z.string().min(1).safeParse(req.query.userId);
    if (!userId.success) {
      return sendError(res, 400, 'bad_request', 'userId query parameter is required');
    }

    const avatar = await getAvatar(userId.data);
    if (!avatar) {
      return sendError(res, 404, 'avatar_not_found', 'No saved avatar was found for this user');
    }

    return res.status(200).json({
      success: true,
      data: avatar,
    });
  }),
);

export default router;
