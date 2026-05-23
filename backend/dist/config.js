"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    NODE_ENV: zod_1.z.string().default('development'),
    DATABASE_URL: zod_1.z.string().min(1),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1),
    CLOUDINARY_API_KEY: zod_1.z.string().min(1),
    CLOUDINARY_API_SECRET: zod_1.z.string().min(1),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    GOOGLE_CLOUD_PROJECT_ID: zod_1.z.string().optional(),
    GOOGLE_CLOUD_LOCATION: zod_1.z.string().default('us-central1'),
    GOOGLE_APPLICATION_CREDENTIALS: zod_1.z.string().optional(),
    VERTEX_TEXT_MODEL: zod_1.z.string().default('gemini-2.5-flash'),
    VERTEX_IMAGE_MODEL: zod_1.z.string().default('imagen-3.0-capability-001'),
});
const env = envSchema.parse(process.env);
exports.config = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    cloudinary: {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
    },
    geminiApiKey: env.GEMINI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    googleCloudProjectId: env.GOOGLE_CLOUD_PROJECT_ID,
    googleCloudLocation: env.GOOGLE_CLOUD_LOCATION,
    googleApplicationCredentials: env.GOOGLE_APPLICATION_CREDENTIALS,
    vertexTextModel: env.VERTEX_TEXT_MODEL,
    vertexImageModel: env.VERTEX_IMAGE_MODEL,
};
