import { Router } from 'express';
import {
  generateReactionVideo,
  getVideoStatus,
  getVideo,
  deleteVideo,
  getVideoTemplates
} from '../controllers/videoController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { body, validateRequest } from '../middleware/validation';

const router = Router();

// Video generation validation
const videoGenerationValidation = [
  body('reactionId')
    .optional()
    .isUUID()
    .withMessage('Invalid reaction ID'),
  body('equation')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Equation must be between 1 and 200 characters'),
  body('style')
    .optional()
    .isIn(['molecular', 'schematic', 'realistic', '3d'])
    .withMessage('Invalid video style'),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Duration must be between 5 and 60 seconds'),
  body('quality')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Quality must be low, medium, or high')
];

// Generate reaction video
router.post('/generate', 
  optionalAuth, 
  videoGenerationValidation, 
  validateRequest, 
  generateReactionVideo
);

// Get video generation status
router.get('/status/:jobId', optionalAuth, getVideoStatus);

// Get generated video
router.get('/:videoId', optionalAuth, getVideo);

// Delete video
router.delete('/:videoId', optionalAuth, deleteVideo);

// Get video templates
router.get('/templates', optionalAuth, getVideoTemplates);

export default router;