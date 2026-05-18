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
const buildMasterPrompt = (garmentType) => {
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
const extractBase64Image = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }
    const candidate = payload;
    const stringFields = ['bytesBase64Encoded', 'base64', 'imageBase64'];
    for (const field of stringFields) {
        if (typeof candidate[field] === 'string' && candidate[field]) {
            return candidate[field];
        }
    }
    if (candidate.image && typeof candidate.image === 'object') {
        return extractBase64Image(candidate.image);
    }
    return null;
};
const generateTryOnImage = async (params) => {
    const [avatar, garment] = await Promise.all([
        (0, image_1.readRemoteImage)(params.avatarUrl),
        (0, image_1.readRemoteImage)(params.garmentUrl),
    ]);
    const authClient = await auth.getClient();
    const accessTokenResponse = await authClient.getAccessToken();
    const accessToken = typeof accessTokenResponse === 'string' ? accessTokenResponse : accessTokenResponse?.token;
    if (!accessToken) {
        throw new http_1.ApiError(500, 'vertex_auth_failed', 'Unable to authenticate with Vertex AI');
    }
    const endpoint = `https://${config_1.config.googleCloudLocation}-aiplatform.googleapis.com/v1/projects/${config_1.config.googleCloudProjectId}/locations/${config_1.config.googleCloudLocation}/publishers/google/models/${config_1.config.vertexImageModel}:predict`;
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
        console.error('[vertex] non-ok response', { status: response.status, body: errorText });
        if (response.status === 429 || /quota|rate limit|too many requests/i.test(errorText)) {
            throw new http_1.ApiError(429, 'vertex_quota_exceeded', 'Too many requests, try again in a moment');
        }
        throw new http_1.ApiError(502, 'vertex_generation_failed', 'Vertex AI failed to generate the try-on image', errorText);
    }
    const json = (await response.json());
    const predictions = Array.isArray(json.predictions) ? json.predictions : [];
    const base64Image = extractBase64Image(predictions[0]) ??
        extractBase64Image(json.generatedImages) ??
        extractBase64Image(json.images);
    if (!base64Image) {
        console.error('[vertex] no image found in prediction response', json);
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
