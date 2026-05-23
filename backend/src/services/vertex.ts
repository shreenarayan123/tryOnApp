import {GoogleAuth} from 'google-auth-library';
import {config} from '../config';
import {ApiError} from '../lib/http';
import {readRemoteImage} from '../lib/image';
import {uploadBufferToCloudinary} from './cloudinary';
import type {GarmentType} from '../types';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

type DetectedAvatarProfile = {
  gender: 'male' | 'female' | 'unknown';
  currentOutfit: string;
};

const genderDetectionPrompt = `
Look at this person's photo and return JSON only:
{
  "gender": "male" | "female" | "unknown",
  "currentOutfit": string // brief description of what they are currently wearing
}
`;

const buildMasterPrompt = (garmentType: GarmentType, detectedGender: DetectedAvatarProfile['gender'], garmentDescription: string) => {
  return `
You are generating a photorealistic virtual try-on image.

TASK: Replace ONLY the clothing on the person with the new garment shown in the garment reference image.

PERSON REFERENCE (preserve exactly):
- Face, facial features, skin tone, hair, expression, and head shape must remain 100% identical
- Do not change age, jawline, nose, eyes, smile, or skin tone
- Body proportions, height, build, and posture must remain identical
- Gender: ${detectedGender}
- Current outfit in avatar: COMPLETELY IGNORE AND REPLACE

GARMENT REFERENCE (apply exactly):
- Garment type: ${garmentType}
- The new garment is: ${garmentDescription}
- Apply ONLY this exact garment — do not invent, add, or carry over any clothing from the person reference
- Preserve exact colors, patterns, fabric texture from the garment reference
- Do not change garment color or pattern to match original outfit

GARMENT SPECIFIC INSTRUCTIONS:
${garmentType === 'lehenga' ? 'Show full lehenga flare, dupatta draped over shoulder. Full body visible.' : ''}
${garmentType === 'saree' ? 'Show complete saree drape with pallu. Full body visible.' : ''}
${garmentType === 'kurta' ? `Show kurta with appropriate ${detectedGender === 'male' ? 'pajama or churidar' : 'bottom wear'}. Full body visible.` : ''}
${garmentType === 'western_top' || garmentType === 'western_dress' ? `Show the top with appropriate ${detectedGender === 'male' ? 'trousers or jeans' : 'bottom wear'}. Full body visible.` : ''}

CRITICAL RULES:
- Do NOT blend or mix the old outfit with the new garment
- Do NOT invent bottom wear that matches the old outfit's color or pattern
- Do NOT add dupatta, ghaghra, or any garment not present in the garment reference
- The bottom wear should be neutral (black, grey, white, navy) unless the garment reference explicitly includes it
- Full body from head to toe must be visible
- Studio lighting, soft grey or white background
- Photorealistic quality, not illustrated
`.trim();
};

const extractBase64Image = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractBase64Image(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const stringFields = ['imageBytes', 'bytesBase64Encoded', 'base64', 'data'];
  for (const field of stringFields) {
    if (typeof candidate[field] === 'string' && candidate[field]) {
      return candidate[field] as string;
    }
  }

  const nestedFields = ['inlineData', 'inline_data', 'image', 'content'];
  for (const field of nestedFields) {
    if (candidate[field] && typeof candidate[field] === 'object') {
      const nested = extractBase64Image(candidate[field]);
      if (nested) {
        return nested;
      }
    }
  }

  if (Array.isArray(candidate.parts)) {
    for (const part of candidate.parts) {
      const nested = extractBase64Image(part);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

const extractTextContent = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (Array.isArray(payload)) {
    const arrayText = payload
      .map(item => extractTextContent(item))
      .filter(Boolean)
      .join('\n');

    return arrayText;
  }

  const candidate = payload as Record<string, unknown>;
  const directTextFields = ['text', 'content'];
  for (const field of directTextFields) {
    if (typeof candidate[field] === 'string' && candidate[field]) {
      return candidate[field] as string;
    }
  }

  const nestedFields = ['content', 'inlineData', 'inline_data', 'image'];
  for (const field of nestedFields) {
    if (candidate[field] && typeof candidate[field] === 'object') {
      const nested = extractTextContent(candidate[field]);
      if (nested) {
        return nested;
      }
    }
  }

  if (Array.isArray(candidate.parts)) {
    const partsText = candidate.parts
      .map(part => extractTextContent(part))
      .filter(Boolean)
      .join('\n');
    if (partsText) {
      return partsText;
    }
  }

  return '';
};

const getAuthClient = async () => {
  const authClient = await auth.getClient();
  const accessTokenResponse = await authClient.getAccessToken();
  const accessToken =
    typeof accessTokenResponse === 'string' ? accessTokenResponse : accessTokenResponse?.token;

  if (!accessToken) {
    console.error('[vertex] no access token; auth response:', accessTokenResponse);
    throw new ApiError(500, 'vertex_auth_failed', 'Unable to authenticate with Vertex AI');
  }

  return accessToken;
};

const callVertexGenerateContent = async (model: string, payload: Record<string, unknown>) => {
  const accessToken = await getAuthClient();
  const endpoint = `https://${config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config.googleCloudProjectId}/locations/${config.googleCloudLocation}/publishers/google/models/${model}:generateContent`;
  console.log('[vertex] calling generateContent endpoint:', endpoint);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response;
};

const detectAvatarProfile = async (avatar: {base64: string; mimeType: string}): Promise<DetectedAvatarProfile> => {
  const response = await callVertexGenerateContent(config.vertexTextModel, {
    contents: [
      {
        role: 'user',
        parts: [
          {text: genderDetectionPrompt},
          {
            inlineData: {
              mimeType: avatar.mimeType,
              data: avatar.base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          gender: {
            type: 'STRING',
            enum: ['male', 'female', 'unknown'],
          },
          currentOutfit: {
            type: 'STRING',
          },
        },
        required: ['gender', 'currentOutfit'],
      },
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[vertex] gender detection failed', {status: response.status, body: errorText});
    throw new ApiError(502, 'vertex_gender_detection_failed', 'Vertex AI failed to detect avatar gender', errorText);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const candidates = Array.isArray(json.candidates) ? json.candidates : [];
  const responseText = extractTextContent(candidates[0]) || extractTextContent(json);

  if (!responseText) {
    console.error('[vertex] no text found in gender detection response', {
      candidateKeys: candidates[0] && typeof candidates[0] === 'object' ? Object.keys(candidates[0] as Record<string, unknown>) : [],
      candidateContentKeys:
        candidates[0] && typeof candidates[0] === 'object' && (candidates[0] as Record<string, unknown>).content && typeof (candidates[0] as Record<string, unknown>).content === 'object'
          ? Object.keys((candidates[0] as Record<string, unknown>).content as Record<string, unknown>)
          : [],
      json,
    });
    throw new ApiError(502, 'vertex_empty_response', 'Vertex AI did not return a gender detection response');
  }

  const sanitizedText = responseText.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(sanitizedText) as Partial<DetectedAvatarProfile>;
    return {
      gender: parsed.gender === 'male' || parsed.gender === 'female' ? parsed.gender : 'unknown',
      currentOutfit: typeof parsed.currentOutfit === 'string' && parsed.currentOutfit.trim()
        ? parsed.currentOutfit.trim()
        : 'unknown outfit',
    };
  } catch (error) {
    console.error('[vertex] failed to parse gender detection JSON', {sanitizedText, error});
    return {
      gender: 'unknown',
      currentOutfit: 'unknown outfit',
    };
  }
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

  if (!config.googleCloudProjectId || !config.googleApplicationCredentials) {
    console.error('[vertex] missing Google Cloud configuration', {
      googleCloudProjectId: config.googleCloudProjectId,
      googleApplicationCredentials: Boolean(config.googleApplicationCredentials),
    });
    throw new ApiError(
      502,
      'vertex_not_configured',
      'Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS, or configure an OpenAI fallback.',
    );
  }
  const detectedProfile = await detectAvatarProfile({base64: avatar.base64, mimeType: avatar.mimeType});
  console.log('[vertex] detected avatar profile:', detectedProfile);

  const response = await callVertexGenerateContent(config.vertexImageModel, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildMasterPrompt(
              params.garmentType,
              detectedProfile.gender,
              detectedProfile.currentOutfit,
            ),
          },
          {
            inlineData: {
              mimeType: avatar.mimeType,
              data: avatar.base64,
            },
          },
          {
            inlineData: {
              mimeType: garment.mimeType,
              data: garment.base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      responseModalities: ['TEXT', 'IMAGE'],
    },
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
  const candidates = Array.isArray(json.candidates) ? json.candidates : [];
  const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
  const content = firstCandidate?.content;
  const parts = content && typeof content === 'object' && !Array.isArray(content)
    ? (content as Record<string, unknown>).parts
    : undefined;
  const base64Image =
    extractBase64Image(parts) ??
    extractBase64Image(firstCandidate) ??
    extractBase64Image((json as Record<string, unknown>).generatedImages) ??
    extractBase64Image((json as Record<string, unknown>).images);

  if (!base64Image) {
    console.error('[vertex] no image found in generateContent response', json);
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
