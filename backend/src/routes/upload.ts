import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFile,
  deleteFile,
  getUserFiles,
  exportReaction,
  importReaction
} from '../controllers/uploadController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { body, validateRequest } from '../middleware/validation';

const router = Router();

// Configure multer for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else {
      uploadPath += 'documents/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, audio, video, and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/json', 'text/plain', 'application/pdf',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// File upload validation
const uploadValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Upload file
router.post('/file', 
  optionalAuth, 
  upload.single('file'), 
  uploadValidation, 
  validateRequest, 
  uploadFile
);

// Upload multiple files
router.post('/files', 
  optionalAuth, 
  upload.array('files', 10), 
  uploadValidation, 
  validateRequest, 
  uploadFile
);

// Get file
router.get('/file/:fileId', optionalAuth, getFile);

// Delete file
router.delete('/file/:fileId', optionalAuth, deleteFile);

// Get user files
router.get('/files', optionalAuth, getUserFiles);

// Export reaction
router.post('/export/reaction/:reactionId', 
  optionalAuth, 
  exportReaction
);

// Import reaction
router.post('/import/reaction', 
  optionalAuth, 
  upload.single('file'), 
  importReaction
);

export default router;