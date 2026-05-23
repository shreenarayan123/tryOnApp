import {GoogleGenerativeAI} from '@google/generative-ai';
import OpenAI from 'openai';
import {config} from '../config';
import {readRemoteImage, readBase64Image} from '../lib/image';
import {ApiError} from '../lib/http';
import {GARMENT_TYPES, type GarmentType, type GarmentDetectionResult, type PhotoValidationResult} from '../types';
import {cloudinary, uploadBufferToCloudinary, uploadRemoteUrlToCloudinary} from './cloudinary';

const useOpenAI = Boolean(config.openaiApiKey);
const openai = useOpenAI ? new OpenAI({apiKey: config.openaiApiKey}) : null;
const googleAI = !useOpenAI && config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const validationModel = googleAI ? googleAI.getGenerativeModel({model: 'gemini-2.0-flash'}) : null;
const garmentModel = googleAI ? googleAI.getGenerativeModel({model: 'gemini-2.0-flash'}) : null;

const parseJson = <T>(text: string): T => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new ApiError(502, 'gemini_invalid_json', 'Gemini returned invalid JSON');
    }

    return JSON.parse(match[0]) as T;
  }
};

const normalizeGarmentType = (value: string): GarmentType => {
  return (GARMENT_TYPES as readonly string[]).includes(value) ? (value as GarmentType) : 'other';
};

const buildImageParts = (value: string) => {
  const {mimeType, base64} = readBase64Image(value);
  return [{inlineData: {data: base64, mimeType}}];
};

export const validatePhoto = async (imageBase64: string): Promise<PhotoValidationResult> => {
  const prompt = `Analyze this photo and return JSON only:\n{\n  valid: boolean,\n  reason: string,\n  issues: ['half_body' | 'blurry' | 'bad_lighting' | 'no_person' | 'multiple_persons'],\n  poseWarning: boolean,\n  poseMessage: string\n}\nMark valid false only for hard failures: no person, multiple people, the subject is clearly not visible from head to toe, or the image is so blurry/dark that the body and clothing cannot be recognized. Do not reject photos for a slight angle, minor crop at the frame edges, background clutter, or normal indoor lighting. If the person is visible from head to toe but the pose is not straight or not facing the camera, keep valid true, set poseWarning true, and provide a helpful poseMessage.`;

  if (useOpenAI && openai) {
    // Upload image to Cloudinary temporarily so we can send a URL to OpenAI
    const {buffer} = readBase64Image(imageBase64);
    const publicId = `validate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uploaded = await uploadBufferToCloudinary(buffer, 'temp/validation', publicId);
    const imageUrl = uploaded.secure_url;

    const system = `You are an assistant that returns JSON only matching the schema exactly. Be conservative only about hard failures, and prefer valid=true when the photo is usable for avatar setup. If valid is false, the reason must be a specific, photo-grounded explanation of what is wrong with the current image, not a generic rejection.`;
    const user = `Analyze this photo at the URL: ${imageUrl} and return JSON only matching the shape: { valid: boolean, reason: string, issues: ['half_body'|'blurry'|'bad_lighting'|'no_person'|'multiple_persons'], poseWarning: boolean, poseMessage: string }. Mark valid false only for hard failures: no person, multiple people, the subject is clearly not visible from head to toe, or the image is so blurry/dark that the body and clothing cannot be recognized. Do not reject photos for a slight angle, minor crop at the frame edges, background clutter, or normal indoor lighting. If the person is visible from head to toe but the pose is not straight or not facing the camera, keep valid true, set poseWarning true, and provide a helpful poseMessage. If invalid, reason must say exactly what is wrong in this photo in one sentence, for example: the person is cropped at the knees, the image is too dark to see the body clearly, or another person is visible in the frame.`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: system},
        {role: 'user', content: user},
      ],
      max_tokens: 500,
      temperature: 0,
    });

    const text = String(res?.choices?.[0]?.message?.content ?? '');
    const parsed = parseJson<Partial<PhotoValidationResult>>(text);
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((issue): issue is PhotoValidationResult['issues'][number] =>
          ['half_body', 'blurry', 'bad_lighting', 'no_person', 'multiple_persons'].includes(issue),
        )
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

  const response = await validationModel!.generateContent([
    prompt,
    ...buildImageParts(imageBase64),
  ]);

  const parsed = parseJson<Partial<PhotoValidationResult>>(response.response.text());
  const issues = Array.isArray(parsed.issues)
    ? parsed.issues.filter((issue): issue is PhotoValidationResult['issues'][number] =>
        ['half_body', 'blurry', 'bad_lighting', 'no_person', 'multiple_persons'].includes(issue),
      )
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

export const detectGarmentType = async (publicId: string): Promise<GarmentDetectionResult> => {
  const imageUrl = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
  });
  if (useOpenAI && openai) {
    // Upload remote URL to Cloudinary to ensure stable accessible URL for OpenAI
    const publicTempId = `garment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uploaded = await uploadRemoteUrlToCloudinary(imageUrl, 'temp/garment', publicTempId);
    const visibleUrl = uploaded.secure_url;

    const system = `Return JSON only in the exact shape: { type: string, description: string }. Type must be one of: ${GARMENT_TYPES.join(' | ')}`;
    const user = `Given the garment image at ${visibleUrl}, what type is it? Return JSON only: { type: string, description: string }`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: system},
        {role: 'user', content: user},
      ],
      max_tokens: 300,
      temperature: 0,
    });

    const text = String(res?.choices?.[0]?.message?.content ?? '');
    const parsed = parseJson<Partial<GarmentDetectionResult>>(text);
    const type = normalizeGarmentType(String(parsed.type ?? 'other').trim());

    return {
      type,
      description: parsed.description ?? 'Garment detected',
    };
  }

  const image = await readRemoteImage(imageUrl);
  const prompt = `What type of Indian garment is this? Return JSON only: { type: string, description: string } type must be one of: lehenga | saree | kurta | anarkali | sharara | salwar_suit | western_top | western_dress | other`;

  const response = await garmentModel!.generateContent([
    prompt,
    {inlineData: {data: image.base64, mimeType: image.mimeType}},
  ]);

  const parsedG = parseJson<Partial<GarmentDetectionResult>>(response.response.text());
  const type = normalizeGarmentType(String(parsedG.type ?? 'other').trim());

  return {
    type,
    description: parsedG.description ?? 'Garment detected',
  };
};
