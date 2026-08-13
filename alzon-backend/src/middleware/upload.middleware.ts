import multer from 'multer';
import { badRequest } from './error.middleware';

const storage = multer.memoryStorage();

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(badRequest('Only JPG, PNG, and WebP images are allowed'));
  }
};

const documentFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(badRequest('Only JPG, PNG, WebP images and PDF documents are allowed'));
  }
};

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single('image');

export const uploadMultipleImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB each
  fileFilter: imageFilter,
}).array('images', 8); // max 8 images

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFilter,
}).single('document');
