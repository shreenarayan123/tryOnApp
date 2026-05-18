"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRemoteImage = exports.readBase64Image = exports.stripDataUrlPrefix = void 0;
const http_1 = require("./http");
const stripDataUrlPrefix = (value) => {
    const match = value.match(/^data:(.+);base64,(.*)$/s);
    if (match) {
        return { mimeType: match[1], base64: match[2] };
    }
    return { mimeType: 'image/jpeg', base64: value };
};
exports.stripDataUrlPrefix = stripDataUrlPrefix;
const readBase64Image = (value) => {
    const { mimeType, base64 } = (0, exports.stripDataUrlPrefix)(value);
    const buffer = Buffer.from(base64, 'base64');
    return { buffer, mimeType, base64 };
};
exports.readBase64Image = readBase64Image;
const readRemoteImage = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new http_1.ApiError(502, 'remote_image_fetch_failed', `Failed to fetch image from ${url}`);
    }
    const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, mimeType, base64: buffer.toString('base64') };
};
exports.readRemoteImage = readRemoteImage;
