import {Router} from 'express';
import {z} from 'zod';
import {asyncHandler, ApiError, sendError} from '../lib/http';
import {generateTryOnImage} from '../services/vertex';
import {GARMENT_TYPES} from '../types';
import multer from 'multer';
import {uploadBufferToCloudinary} from '../services/cloudinary';

const router = Router();

const schema = z.object({
  avatarUrl: z.string().url(),
  garmentUrl: z.string().url(),
  garmentType: z.enum(GARMENT_TYPES),
});

router.post(
  '/tryon/generate',
  asyncHandler(async (req, res) => {
    console.log('[tryon] /tryon/generate request body:', req.body);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'bad_request', 'avatarUrl, garmentUrl, and garmentType are required');
    }

    try {
      const result = await generateTryOnImage(parsed.data);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return sendError(res, error.statusCode, error.code, error.message, error.details);
      }

      throw error;
    }
  }),
);

export default router;

// Support legacy mobile client: multipart POST /api/tryon with `avatar` and `garment` files
const upload = multer({storage: multer.memoryStorage()});
router.post(
  '/tryon',
  upload.fields([{name: 'avatar', maxCount: 1}, {name: 'garment', maxCount: 1}]),
  asyncHandler(async (req, res) => {
    // multer puts files on req.files
    const files = (req as any).files as Record<string, any[]> | undefined;
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
      return res.status(400).json({success: false, error: 'Missing avatar or garment file'});
    }

    // Upload both to Cloudinary
    const avatarUpload = await uploadBufferToCloudinary(avatarFile.buffer, 'avatars', `avatar-${Date.now()}`);
    console.log('[tryon] avatar uploaded to cloudinary:', avatarUpload.secure_url);
    const garmentUpload = await uploadBufferToCloudinary(garmentFile.buffer, 'garments', `garment-${Date.now()}`);
    console.log('[tryon] garment uploaded to cloudinary:', garmentUpload.secure_url);

    try {
      const start = Date.now();
      const result = await generateTryOnImage({
        avatarUrl: avatarUpload.secure_url,
        garmentUrl: garmentUpload.secure_url,
        garmentType: 'other',
      });

      return res.status(200).json({
        success: true,
        resultUrl: result.resultUrl,
        processingTime: Date.now() - start,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({success: false, error: error.message, code: error.code});
      }

      throw error;
    }
  }),
);
