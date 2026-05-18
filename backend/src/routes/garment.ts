import {Router} from 'express';
import {z} from 'zod';
import {processCloudinaryImage} from '../services/cloudinary';
import {detectGarmentType} from '../services/gemini';
import {asyncHandler, sendError} from '../lib/http';

const router = Router();

const schema = z.object({
  publicId: z.string().min(1),
});

router.post(
  '/process-garment',
  asyncHandler(async (req, res) => {
    console.log('[garment] /process-garment called with body:', req.body);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'bad_request', 'publicId is required');
    }

    const [processed, garment] = await Promise.all([
      processCloudinaryImage(parsed.data.publicId, 'garments/processed', [
        'background_removal',
        'improve:80',
        'sharpen:60',
        'vibrance:40',
      ]),
      detectGarmentType(parsed.data.publicId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        processed_url: processed.processedUrl,
        original_url: processed.originalUrl,
        garment_type: garment,
      },
    });
  }),
);

export default router;
