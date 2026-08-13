import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export type UploadFolder = 'products' | 'suppliers' | 'verification';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Upload a file buffer to Cloudinary.
 * Verification documents are uploaded as 'private' (not publicly accessible).
 * Includes automatic mock fallback for local dev when keys are placeholder values.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: UploadFolder,
  resourceType: 'image' | 'raw' = 'image',
  isPrivate = false,
): Promise<CloudinaryUploadResult> {
  const isPlaceholderKey =
    !env.CLOUDINARY_CLOUD_NAME ||
    env.CLOUDINARY_CLOUD_NAME === 'placeholder' ||
    env.CLOUDINARY_CLOUD_NAME.includes('your-cloud-name');

  if (isPlaceholderKey) {
    logger.info(`[Cloudinary Dev Mode] Simulating file upload for folder: ${folder}`);
    const mockId = `alzon_dev_${folder}_${Date.now()}`;
    return {
      public_id: mockId,
      secure_url:
        folder === 'verification'
          ? `https://res.cloudinary.com/demo/image/upload/sample.jpg`
          : `https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&fit=crop`,
      format: 'jpg',
      bytes: fileBuffer.length,
      width: 800,
      height: 600,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `alzon/${folder}`,
        resource_type: resourceType,
        type: isPrivate ? 'private' : 'upload',
        allowed_formats:
          resourceType === 'image'
            ? ['jpg', 'jpeg', 'png', 'webp']
            : ['jpg', 'jpeg', 'png', 'pdf'],
      },
      (error, result) => {
        if (error || !result) {
          logger.error('[Cloudinary Upload Error]', { error });
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      },
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image',
): Promise<void> {
  const isPlaceholderKey =
    !env.CLOUDINARY_CLOUD_NAME ||
    env.CLOUDINARY_CLOUD_NAME === 'placeholder' ||
    env.CLOUDINARY_CLOUD_NAME.includes('your-cloud-name');

  if (isPlaceholderKey) {
    logger.info(`[Cloudinary Dev Mode] Simulating deletion of public_id: ${publicId}`);
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
