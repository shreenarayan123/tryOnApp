import {ApiError} from './http';

export interface RemoteImage {
  buffer: Buffer;
  mimeType: string;
  base64: string;
}

export const stripDataUrlPrefix = (value: string) => {
  const match = value.match(/^data:(.+);base64,(.*)$/s);
  if (match) {
    return {mimeType: match[1], base64: match[2]};
  }

  return {mimeType: 'image/jpeg', base64: value};
};

export const readBase64Image = (value: string): RemoteImage => {
  const {mimeType, base64} = stripDataUrlPrefix(value);
  const buffer = Buffer.from(base64, 'base64');
  return {buffer, mimeType, base64};
};

export const readRemoteImage = async (url: string): Promise<RemoteImage> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(502, 'remote_image_fetch_failed', `Failed to fetch image from ${url}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  return {buffer, mimeType, base64: buffer.toString('base64')};
};
