import { Router } from 'express';
import {
  getSafetyData,
  getAllSafetyData
} from '../controllers/safetyController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', optionalAuth, getAllSafetyData);
router.get('/:symbol', optionalAuth, getSafetyData);

export default router;