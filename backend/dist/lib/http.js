"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = exports.asyncHandler = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.ApiError = ApiError;
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const sendError = (res, statusCode, code, error, details) => {
    return res.status(statusCode).json({
        success: false,
        error,
        code,
        ...(details === undefined ? {} : { details }),
    });
};
exports.sendError = sendError;
const sendSuccess = (res, payload) => {
    return res.status(200).json({
        success: true,
        ...payload,
    });
};
exports.sendSuccess = sendSuccess;
