"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.uploadRemoteUrlToCloudinary = exports.uploadBufferToCloudinary = exports.processCloudinaryImage = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const config_1 = require("../config");
const http_1 = require("../lib/http");
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinary.cloudName,
    api_key: config_1.config.cloudinary.apiKey,
    api_secret: config_1.config.cloudinary.apiSecret,
    secure: true,
});
const retryOnce = async (operation) => {
    try {
        return await operation();
    }
    catch (firstError) {
        return await operation().catch(() => {
            throw firstError;
        });
    }
};
const getOriginalUrl = (publicId) => {
    return cloudinary_1.v2.url(publicId, {
        secure: true,
        resource_type: 'image',
    });
};
const getTransformedUrl = (publicId, effects) => {
    return cloudinary_1.v2.url(publicId, {
        secure: true,
        resource_type: 'image',
        transformation: effects.map(effect => ({ effect })),
    });
};
const processCloudinaryImage = async (publicId, folder, effects) => {
    const originalUrl = getOriginalUrl(publicId);
    const transformedUrl = getTransformedUrl(publicId, effects);
    const uploaded = await retryOnce(() => cloudinary_1.v2.uploader.upload(transformedUrl, {
        folder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
    }));
    if (!uploaded.secure_url) {
        throw new http_1.ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
    }
    return {
        originalUrl,
        transformedUrl,
        processedUrl: uploaded.secure_url,
        processedPublicId: uploaded.public_id,
    };
};
exports.processCloudinaryImage = processCloudinaryImage;
const uploadBufferToCloudinary = async (buffer, folder, publicId) => {
    const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    const uploaded = await retryOnce(() => cloudinary_1.v2.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        unique_filename: true,
    }));
    if (!uploaded.secure_url) {
        throw new http_1.ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
    }
    return uploaded;
};
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const uploadRemoteUrlToCloudinary = async (url, folder, publicId) => {
    const uploaded = await retryOnce(() => cloudinary_1.v2.uploader.upload(url, {
        folder,
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        unique_filename: true,
    }));
    if (!uploaded.secure_url) {
        throw new http_1.ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
    }
    return uploaded;
};
exports.uploadRemoteUrlToCloudinary = uploadRemoteUrlToCloudinary;
