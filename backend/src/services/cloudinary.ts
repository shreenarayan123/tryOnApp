import {v2 as cloudinary} from 'cloudinary';
import {config} from '../config';
import {ApiError} from '../lib/http';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

const retryOnce = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (firstError) {
    return await operation().catch(() => {
      throw firstError;
    });
  }
};

const getOriginalUrl = (publicId: string) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
  });
};

const getTransformedUrl = (publicId: string, effects: string[]) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: effects.map(effect => ({effect})),
  });
};

export const processCloudinaryImage = async (
  publicId: string,
  folder: string,
  effects: string[],
) => {
  const originalUrl = getOriginalUrl(publicId);
  const transformedUrl = getTransformedUrl(publicId, effects);

  const uploaded = await retryOnce(() =>
    cloudinary.uploader.upload(transformedUrl, {
      folder,
      resource_type: 'image',
      overwrite: false,
      unique_filename: true,
    }),
  );

  if (!uploaded.secure_url) {
    throw new ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
  }

  return {
    originalUrl,
    transformedUrl,
    processedUrl: uploaded.secure_url,
    processedPublicId: uploaded.public_id,
  };
};

export const uploadBufferToCloudinary = async (buffer: Buffer, folder: string, publicId: string) => {
  const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;

  const uploaded = await retryOnce(() =>
    cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      public_id: publicId,
      overwrite: false,
      unique_filename: true,
    }),
  );

  if (!uploaded.secure_url) {
    throw new ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
  }

  return uploaded;
};

export const uploadRemoteUrlToCloudinary = async (url: string, folder: string, publicId: string) => {
  const uploaded = await retryOnce(() =>
    cloudinary.uploader.upload(url, {
      folder,
      resource_type: 'image',
      public_id: publicId,
      overwrite: false,
      unique_filename: true,
    }),
  );

  if (!uploaded.secure_url) {
    throw new ApiError(500, 'cloudinary_upload_failed', 'Cloudinary did not return a secure URL');
  }

  return uploaded;
};

export {cloudinary};
