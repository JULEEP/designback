import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generic file upload function
export const createUploader = (options = {}) => {
  const {
    destination = 'uploads/',
    allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/,
    maxSize = 5 * 1024 * 1024, // 5MB default
    prefix = 'file'
  } = options;

  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const originalName = path.basename(file.originalname, ext);
      const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
      cb(null, `${prefix}-${safeName}-${uniqueSuffix}${ext}`);
    }
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes} files are allowed`));
    }
  };

  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter
  });
};

// Pre-configured uploaders for different use cases
export const uploadMovieImage = createUploader({
  destination: 'uploads/movies/',
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 10 * 1024 * 1024, // 10MB for movie images
  prefix: 'movie'
});

export const uploadTicketImage = createUploader({
  destination: 'uploads/tickets/',
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024, // 5MB
  prefix: 'ticket'
});


export const uploadMovieFiles = createUploader({
  destination: 'uploads/', // common base folder
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024,
  prefix: 'movie'
});


export const uploadProfileImage = createUploader({
  destination: 'uploads/profiles/',
  allowedTypes: /jpeg|jpg|png|gif/,
  maxSize: 2 * 1024 * 1024, // 2MB
  prefix: 'profile'
});

export const uploadDocument = createUploader({
  destination: 'uploads/documents/',
  allowedTypes: /pdf|doc|docx|txt/,
  maxSize: 10 * 1024 * 1024, // 10MB
  prefix: 'doc'
});


export const uploadMovieNameImage = createUploader({
  destination: "uploads/movies/",
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024, // 5MB
  prefix: "movie"
});


export const uploadBannerImage = createUploader({
  destination: "uploads/banners/",
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024, // 5MB
  prefix: "banner"
});


export const uploadAdminProfileImage = createUploader({
  destination: "uploads/admins/",
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024, // 5MB
  prefix: "profile",
});


export const uploadBillBookFile = createUploader({
  destination: "uploads/billbook/",
  allowedTypes: /jpeg|jpg|png|gif|webp|pdf/,
  maxSize: 10 * 1024 * 1024, // 10MB
  prefix: "billbook",
});


// Multiple files uploader
export const createMultipleUploader = (options = {}) => {
  const uploader = createUploader(options);
  return uploader.array('files', options.maxCount || 10);
};

// Single file upload middleware generator
export const singleFileUpload = (fieldName, options = {}) => {
  const uploader = createUploader(options);
  return uploader.single(fieldName);
};

// Multiple files upload middleware generator
export const multipleFilesUpload = (fieldName, maxCount = 5, options = {}) => {
  const uploader = createUploader(options);
  return uploader.array(fieldName, maxCount);
};

// Dynamic fields upload (multiple fields with different files)
export const fieldsUpload = (fieldsConfig, options = {}) => {
  const uploader = createUploader(options);
  const fields = fieldsConfig.map(field => ({
    name: field.name,
    maxCount: field.maxCount || 1
  }));
  return uploader.fields(fields);
};