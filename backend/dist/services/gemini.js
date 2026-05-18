"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectGarmentType = exports.validatePhoto = void 0;
const generative_ai_1 = require("@google/generative-ai");
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const image_1 = require("../lib/image");
const http_1 = require("../lib/http");
const types_1 = require("../types");
const cloudinary_1 = require("./cloudinary");
const useOpenAI = Boolean(config_1.config.openaiApiKey);
const openai = useOpenAI ? new openai_1.default({ apiKey: config_1.config.openaiApiKey }) : null;
const googleAI = !useOpenAI && config_1.config.geminiApiKey ? new generative_ai_1.GoogleGenerativeAI(config_1.config.geminiApiKey) : null;
const validationModel = googleAI ? googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;
const garmentModel = googleAI ? googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;
const parseJson = (text) => {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    }
    catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new http_1.ApiError(502, 'gemini_invalid_json', 'Gemini returned invalid JSON');
        }
        return JSON.parse(match[0]);
    }
};
const normalizeGarmentType = (value) => {
    return types_1.GARMENT_TYPES.includes(value) ? value : 'other';
};
const buildImageParts = (value) => {
    const { mimeType, base64 } = (0, image_1.readBase64Image)(value);
    return [{ inlineData: { data: base64, mimeType } }];
};
const validatePhoto = async (imageBase64) => {
    const prompt = `Analyze this photo and return JSON only:\n{\n  valid: boolean,\n  reason: string,\n  issues: ['half_body' | 'blurry' | 'bad_lighting' | 'no_person' | 'multiple_persons'],\n  poseWarning: boolean,\n  poseMessage: string\n}\nOnly mark valid true when the image shows one clear full-body person, sharp enough, with usable lighting. If the pose is not straight and facing the camera, set poseWarning true and provide a helpful poseMessage without making the photo invalid.`;
    if (useOpenAI && openai) {
        // Upload image to Cloudinary temporarily so we can send a URL to OpenAI
        const { buffer } = (0, image_1.readBase64Image)(imageBase64);
        const publicId = `validate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const uploaded = await (0, cloudinary_1.uploadBufferToCloudinary)(buffer, 'temp/validation', publicId);
        const imageUrl = uploaded.secure_url;
        const system = `You are an assistant that returns JSON only matching the schema exactly.`;
        const user = `Analyze this photo at the URL: ${imageUrl} and return JSON only matching the shape: { valid: boolean, reason: string, issues: ['half_body'|'blurry'|'bad_lighting'|'no_person'|'multiple_persons'], poseWarning: boolean, poseMessage: string }. Only set valid true when the image shows one clear full-body person, sharp and with usable lighting.`;
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            max_tokens: 500,
            temperature: 0,
        });
        const text = String(res?.choices?.[0]?.message?.content ?? '');
        const parsed = parseJson(text);
        const issues = Array.isArray(parsed.issues)
            ? parsed.issues.filter((issue) => ['half_body', 'blurry', 'bad_lighting', 'no_person', 'multiple_persons'].includes(issue))
            : [];
        const valid = Boolean(parsed.valid);
        const poseWarning = Boolean(parsed.poseWarning);
        return {
            valid,
            reason: parsed.reason ?? '',
            issues,
            poseWarning,
            poseMessage: parsed.poseMessage ?? (poseWarning ? 'For best results, stand straight facing the camera.' : ''),
            code: valid ? undefined : issues[0] ?? 'invalid_photo',
        };
    }
    const response = await validationModel.generateContent([
        prompt,
        ...buildImageParts(imageBase64),
    ]);
    const parsed = parseJson(response.response.text());
    const issues = Array.isArray(parsed.issues)
        ? parsed.issues.filter((issue) => ['half_body', 'blurry', 'bad_lighting', 'no_person', 'multiple_persons'].includes(issue))
        : [];
    const valid = Boolean(parsed.valid);
    const poseWarning = Boolean(parsed.poseWarning);
    return {
        valid,
        reason: parsed.reason ?? '',
        issues,
        poseWarning,
        poseMessage: parsed.poseMessage ?? (poseWarning ? 'For best results, stand straight facing the camera.' : ''),
        code: valid ? undefined : issues[0] ?? 'invalid_photo',
    };
};
exports.validatePhoto = validatePhoto;
const detectGarmentType = async (publicId) => {
    const imageUrl = cloudinary_1.cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image',
    });
    if (useOpenAI && openai) {
        // Upload remote URL to Cloudinary to ensure stable accessible URL for OpenAI
        const publicTempId = `garment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const uploaded = await (0, cloudinary_1.uploadRemoteUrlToCloudinary)(imageUrl, 'temp/garment', publicTempId);
        const visibleUrl = uploaded.secure_url;
        const system = `Return JSON only in the exact shape: { type: string, description: string }. Type must be one of: ${types_1.GARMENT_TYPES.join(' | ')}`;
        const user = `Given the garment image at ${visibleUrl}, what type is it? Return JSON only: { type: string, description: string }`;
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            max_tokens: 300,
            temperature: 0,
        });
        const text = String(res?.choices?.[0]?.message?.content ?? '');
        const parsed = parseJson(text);
        const type = normalizeGarmentType(String(parsed.type ?? 'other').trim());
        return {
            type,
            description: parsed.description ?? 'Garment detected',
        };
    }
    const image = await (0, image_1.readRemoteImage)(imageUrl);
    const prompt = `What type of Indian garment is this? Return JSON only: { type: string, description: string } type must be one of: lehenga | saree | kurta | anarkali | sharara | salwar_suit | western_top | western_dress | other`;
    const response = await garmentModel.generateContent([
        prompt,
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
    ]);
    const parsedG = parseJson(response.response.text());
    const type = normalizeGarmentType(String(parsedG.type ?? 'other').trim());
    return {
        type,
        description: parsedG.description ?? 'Garment detected',
    };
};
exports.detectGarmentType = detectGarmentType;
