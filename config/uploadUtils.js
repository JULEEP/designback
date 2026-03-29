import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generic file upload function
export const createUploader = (options = {}) => {
  const {
    destination = 'uploads/',
    allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/,
    maxSize = 5 * 1024 * 1024,
    prefix = 'file'
  } = options;

  // Create destination directory if it doesn't exist
  const fullDestination = path.join(__dirname, '..', destination);
  if (!fs.existsSync(fullDestination)) {
    fs.mkdirSync(fullDestination, { recursive: true });
  }

  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullDestination);
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

// Create specific uploader for billbook
export const uploadBillBook = createUploader({
  destination: "uploads/billbook/",
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 10 * 1024 * 1024,
  prefix: "billbook"
});

// Export upload middleware for billbook
export const uploadBillBookFiles = uploadBillBook.fields([
  { name: 'templateImage', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'previewImage', maxCount: 1 }
]);


// Business logo uploader
export const uploadBusinessLogo = createUploader({
  destination: "uploads/business/",
  allowedTypes: /jpeg|jpg|png|gif|webp/,
  maxSize: 5 * 1024 * 1024, // 5MB
  prefix: "business"
});