"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const validatePhoto_1 = __importDefault(require("./routes/validatePhoto"));
const avatar_1 = __importDefault(require("./routes/avatar"));
const garment_1 = __importDefault(require("./routes/garment"));
const tryon_1 = __importDefault(require("./routes/tryon"));
const http_1 = require("./lib/http");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '20mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
    app.get('/health', (_req, res) => {
        res.status(200).json({ success: true, status: 'ok' });
    });
    app.use('/api', validatePhoto_1.default);
    app.use('/api', avatar_1.default);
    app.use('/api', garment_1.default);
    app.use('/api', tryon_1.default);
    app.use((_req, res) => {
        return (0, http_1.sendError)(res, 404, 'not_found', 'Route not found');
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((error, _req, res, _next) => {
        if (error instanceof http_1.ApiError) {
            return (0, http_1.sendError)(res, error.statusCode, error.code, error.message, error.details);
        }
        if (error instanceof zod_1.ZodError) {
            return (0, http_1.sendError)(res, 400, 'validation_error', 'Invalid request body', error.flatten());
        }
        console.error(error);
        return (0, http_1.sendError)(res, 500, 'internal_error', 'Something went wrong');
    });
    return app;
};
exports.createApp = createApp;
