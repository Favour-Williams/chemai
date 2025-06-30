import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  rateMessage,
  getChatStats,
  clearChatCache
} from '../controllers/chatController';
import { optionalAuth, authenticateToken } from '../middleware/auth';
import { body, param, validateRequest } from '../middleware/validation';

const router = Router();

// Message validation
const messageValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('Invalid conversation ID'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

const ratingValidation = [
  param('conversationId')
    .isUUID()
    .withMessage('Invalid conversation ID'),
  param('messageId')
    .isUUID()
    .withMessage('Invalid message ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Chat routes
router.post('/message', optionalAuth, messageValidation, validateRequest, sendMessage);
router.get('/conversations', optionalAuth, getConversations);
router.get('/conversations/:id', optionalAuth, getConversation);
router.delete('/conversations/:id', optionalAuth, deleteConversation);
router.post('/conversations/:conversationId/messages/:messageId/rate', 
  optionalAuth, ratingValidation, validateRequest, rateMessage);

// Admin routes
router.get('/admin/stats', authenticateToken, getChatStats);
router.post('/admin/cache/clear', authenticateToken, clearChatCache);

export default router;