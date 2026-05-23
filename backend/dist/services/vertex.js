"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTryOnImage = void 0;
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("../config");
const http_1 = require("../lib/http");
const image_1 = require("../lib/image");
const cloudinary_1 = require("./cloudinary");
const auth = new google_auth_library_1.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const genderDetectionPrompt = `
Look at this person's photo and return JSON only:
{
  "gender": "male" | "female" | "unknown",
  "currentOutfit": string // brief description of what they are currently wearing
}
`;
const buildMasterPrompt = (garmentType, detectedGender, garmentDescription) => {
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
const extractBase64Image = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }
    const candidate = payload;
    const stringFields = ['imageBytes', 'bytesBase64Encoded', 'base64', 'data'];
    for (const field of stringFields) {
        if (typeof candidate[field] === 'string' && candidate[field]) {
            return candidate[field];
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
const extractTextContent = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return '';
    }
    const candidate = payload;
    const directTextFields = ['text', 'content'];
    for (const field of directTextFields) {
        if (typeof candidate[field] === 'string' && candidate[field]) {
            return candidate[field];
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
    const accessToken = typeof accessTokenResponse === 'string' ? accessTokenResponse : accessTokenResponse?.token;
    if (!accessToken) {
        console.error('[vertex] no access token; auth response:', accessTokenResponse);
        throw new http_1.ApiError(500, 'vertex_auth_failed', 'Unable to authenticate with Vertex AI');
    }
    return accessToken;
};
const callVertexGenerateContent = async (model, payload) => {
    const accessToken = await getAuthClient();
    const endpoint = `https://${config_1.config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config_1.config.googleCloudProjectId}/locations/${config_1.config.googleCloudLocation}/publishers/google/models/${model}:generateContent`;
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
const detectAvatarProfile = async (avatar) => {
    const response = await callVertexGenerateContent(config_1.config.vertexTextModel, {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: genderDetectionPrompt },
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
        console.error('[vertex] gender detection failed', { status: response.status, body: errorText });
        throw new http_1.ApiError(502, 'vertex_gender_detection_failed', 'Vertex AI failed to detect avatar gender', errorText);
    }
    const json = (await response.json());
    const candidates = Array.isArray(json.candidates) ? json.candidates : [];
    const responseText = extractTextContent(candidates[0]) || extractTextContent(json);
    if (!responseText) {
        console.error('[vertex] no text found in gender detection response', {
            candidateKeys: candidates[0] && typeof candidates[0] === 'object' ? Object.keys(candidates[0]) : [],
            candidateContentKeys: candidates[0] && typeof candidates[0] === 'object' && candidates[0].content && typeof candidates[0].content === 'object'
                ? Object.keys(candidates[0].content)
                : [],
            json,
        });
        throw new http_1.ApiError(502, 'vertex_empty_response', 'Vertex AI did not return a gender detection response');
    }
    const sanitizedText = responseText.replace(/```json|```/g, '').trim();
    try {
        const parsed = JSON.parse(sanitizedText);
        return {
            gender: parsed.gender === 'male' || parsed.gender === 'female' ? parsed.gender : 'unknown',
            currentOutfit: typeof parsed.currentOutfit === 'string' && parsed.currentOutfit.trim()
                ? parsed.currentOutfit.trim()
                : 'unknown outfit',
        };
    }
    catch (error) {
        console.error('[vertex] failed to parse gender detection JSON', { sanitizedText, error });
        return {
            gender: 'unknown',
            currentOutfit: 'unknown outfit',
        };
    }
};
const generateTryOnImage = async (params) => {
    const [avatar, garment] = await Promise.all([
        (0, image_1.readRemoteImage)(params.avatarUrl),
        (0, image_1.readRemoteImage)(params.garmentUrl),
    ]);
    if (!config_1.config.googleCloudProjectId || !config_1.config.googleApplicationCredentials) {
        console.error('[vertex] missing Google Cloud configuration', {
            googleCloudProjectId: config_1.config.googleCloudProjectId,
            googleApplicationCredentials: Boolean(config_1.config.googleApplicationCredentials),
        });
        throw new http_1.ApiError(502, 'vertex_not_configured', 'Vertex AI is not configured. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS, or configure an OpenAI fallback.');
    }
    const detectedProfile = await detectAvatarProfile({ base64: avatar.base64, mimeType: avatar.mimeType });
    console.log('[vertex] detected avatar profile:', detectedProfile);
    const response = await callVertexGenerateContent(config_1.config.vertexImageModel, {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: buildMasterPrompt(params.garmentType, detectedProfile.gender, detectedProfile.currentOutfit),
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
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('[vertex] non-ok response', { status: response.status, body: errorText });
        if (response.status === 429 || /quota|rate limit|too many requests/i.test(errorText)) {
            throw new http_1.ApiError(429, 'vertex_quota_exceeded', 'Too many requests, try again in a moment');
        }
        throw new http_1.ApiError(502, 'vertex_generation_failed', 'Vertex AI failed to generate the try-on image', errorText);
    }
    const json = (await response.json());
    const candidates = Array.isArray(json.candidates) ? json.candidates : [];
    const base64Image = extractBase64Image(candidates[0]) ??
        extractBase64Image(json.generatedImages) ??
        extractBase64Image(json.images);
    if (!base64Image) {
        console.error('[vertex] no image found in generateContent response', json);
        throw new http_1.ApiError(502, 'vertex_empty_response', 'Vertex AI did not return an image');
    }
    const resultBuffer = Buffer.from(base64Image, 'base64');
    const uploaded = await (0, cloudinary_1.uploadBufferToCloudinary)(resultBuffer, 'results', `tryon-${Date.now()}`);
    return {
        resultUrl: uploaded.secure_url,
        resultPublicId: uploaded.public_id,
    };
};
exports.generateTryOnImage = generateTryOnImage;
