import { Router } from 'express';
import multer from 'multer';
import {
  synthesizeText,
  processVoiceMessage,
  getVoiceHistory,
  deleteVoiceMessage
} from '../controllers/voiceController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { body, validateRequest } from '../middleware/validation';

const router = Router();

// Configure multer for audio file uploads
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/audio/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
  }
});

const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Voice synthesis validation
const synthesizeValidation = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Text must be between 1 and 1000 characters'),
  body('voice')
    .optional()
    .isIn(['male', 'female', 'neutral'])
    .withMessage('Voice must be male, female, or neutral'),
  body('speed')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage('Speed must be between 0.5 and 2.0'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja'])
    .withMessage('Unsupported language')
];

// Voice message processing validation
const voiceMessageValidation = [
  body('transcript')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Transcript must be less than 1000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

// Voice synthesis endpoint
router.post('/synthesize', 
  optionalAuth, 
  synthesizeValidation, 
  validateRequest, 
  synthesizeText
);

// Voice message processing endpoint
router.post('/process', 
  optionalAuth,
  audioUpload.single('audio'),
  voiceMessageValidation,
  validateRequest,
  processVoiceMessage
);

// Get voice history
router.get('/history', optionalAuth, getVoiceHistory);

// Delete voice message
router.delete('/messages/:id', optionalAuth, deleteVoiceMessage);

export default router;