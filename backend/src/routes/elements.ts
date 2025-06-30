import { Router } from 'express';
import {
  getAllElements,
  getElementById,
  searchElements,
  getElementCategories
} from '../controllers/elementsController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (with optional authentication for personalization)
router.get('/', optionalAuth, getAllElements);
router.get('/search', optionalAuth, searchElements);
router.get('/categories', optionalAuth, getElementCategories);
router.get('/:symbol', optionalAuth, getElementById);

export default router;