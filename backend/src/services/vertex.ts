import {GoogleAuth} from 'google-auth-library';
import {config} from '../config';
import {ApiError} from '../lib/http';
import {readRemoteImage} from '../lib/image';
import {uploadBufferToCloudinary} from './cloudinary';
import type {GarmentType} from '../types';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const buildMasterPrompt = (garmentType: GarmentType) => {
  return `
A photorealistic full-body image of a woman wearing a ${garmentType}.
The person's face, skin tone, hair, and body proportions must be preserved exactly from the reference photo.
The garment / cloth should drape and flow naturally with realistic fabric physics.
${garmentType === 'lehenga' ? 'Show full lehenga flare, dupatta draped naturally over shoulder.' : ''}
${garmentType === 'saree' ? 'Show complete saree drape with pallu falling naturally.' : ''}
Studio lighting, white or soft grey background.
Full body visible from head to toe.
High detail embroidery and embellishment preserved from garment reference.
Photographic quality, not illustrated or cartoon.
`.trim();
};

const extractBase64Image = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const stringFields = ['bytesBase64Encoded', 'base64', 'imageBase64'];
  for (const field of stringFields) {
    if (typeof candidate[field] === 'string' && candidate[field]) {
      return candidate[field] as string;
    }
  }

  if (candidate.image && typeof candidate.image === 'object') {
    return extractBase64Image(candidate.image);
  }

  return null;
};

export const generateTryOnImage = async (params: {
  avatarUrl: string;
  garmentUrl: string;
  garmentType: GarmentType;
}) => {
  const [avatar, garment] = await Promise.all([
    readRemoteImage(params.avatarUrl),
    readRemoteImage(params.garmentUrl),
  ]);

  const authClient = await auth.getClient();
  const accessTokenResponse = await authClient.getAccessToken();
  const accessToken = typeof accessTokenResponse === 'string' ? accessTokenResponse : accessTokenResponse?.token;

  if (!accessToken) {
    throw new ApiError(500, 'vertex_auth_failed', 'Unable to authenticate with Vertex AI');
  }

  const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProjectId}/locations/${config.googleCloudLocation}/publishers/google/models/${config.vertexImageModel}:predict`;
  console.log('[vertex] calling endpoint:', endpoint);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: buildMasterPrompt(params.garmentType),
          referenceImages: [
            {
              image: {
                bytesBase64Encoded: avatar.base64,
                mimeType: avatar.mimeType,
              },
              referenceType: 'subject',
            },
            {
              image: {
                bytesBase64Encoded: garment.base64,
                mimeType: garment.mimeType,
              },
              referenceType: 'style',
            },
          ],
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '3:4',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[vertex] non-ok response', {status: response.status, body: errorText});
    if (response.status === 429 || /quota|rate limit|too many requests/i.test(errorText)) {
      throw new ApiError(429, 'vertex_quota_exceeded', 'Too many requests, try again in a moment');
    }

    throw new ApiError(502, 'vertex_generation_failed', 'Vertex AI failed to generate the try-on image', errorText);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const predictions = Array.isArray(json.predictions) ? json.predictions : [];
  const base64Image =
    extractBase64Image(predictions[0]) ??
    extractBase64Image((json as Record<string, unknown>).generatedImages) ??
    extractBase64Image((json as Record<string, unknown>).images);

  if (!base64Image) {
    console.error('[vertex] no image found in prediction response', json);
    throw new ApiError(502, 'vertex_empty_response', 'Vertex AI did not return an image');
  }

  const resultBuffer = Buffer.from(base64Image, 'base64');
  const uploaded = await uploadBufferToCloudinary(
    resultBuffer,
    'results',
    `tryon-${Date.now()}`,
  );

  return {
    resultUrl: uploaded.secure_url,
    resultPublicId: uploaded.public_id,
  };
};
