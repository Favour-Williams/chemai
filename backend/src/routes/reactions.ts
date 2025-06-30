import { Router } from 'express';
import {
  getAllReactions,
  getReactionById,
  createReaction,
  updateReaction,
  deleteReaction,
  searchReactions,
  simulateReaction,
  validateReaction,
  getReactionSafety
} from '../controllers/reactionsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { reactionValidation, validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Simulation validation
const simulationValidation = [
  body('reactants')
    .isArray({ min: 1 })
    .withMessage('At least one reactant is required'),
  body('temperature')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Temperature must be a positive number'),
  body('pressure')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pressure must be a positive number'),
  body('catalyst')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Catalyst name must be less than 100 characters')
];

// Public routes
router.get('/', optionalAuth, getAllReactions);
router.get('/search', optionalAuth, searchReactions);
router.get('/:id', optionalAuth, getReactionById);
router.get('/:id/safety', optionalAuth, getReactionSafety);

// Reaction simulation and validation
router.post('/simulate', 
  optionalAuth, 
  simulationValidation, 
  validateRequest, 
  simulateReaction
);

router.post('/validate', 
  optionalAuth, 
  reactionValidation, 
  validateRequest, 
  validateReaction
);

// Protected routes
router.post('/', authenticateToken, reactionValidation, validateRequest, createReaction);
router.put('/:id', authenticateToken, updateReaction);
router.delete('/:id', authenticateToken, deleteReaction);

export default router;