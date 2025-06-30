import { Router } from 'express';
import {
  getAllElements,
  getElementById,
  searchElements,
  getElementCategories,
  searchCompounds,
  getCompound,
  getCacheStats,
  clearCache
} from '../controllers/enhancedElementsController';
import { optionalAuth, authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (with optional authentication for personalization)
router.get('/', optionalAuth, getAllElements);
router.get('/search', optionalAuth, searchElements);
router.get('/categories', optionalAuth, getElementCategories);
router.get('/compounds/search', optionalAuth, searchCompounds);
router.get('/compounds/:name', optionalAuth, getCompound);
router.get('/:symbol', optionalAuth, getElementById);

// Admin routes
router.get('/admin/cache/stats', authenticateToken, getCacheStats);
router.post('/admin/cache/clear', authenticateToken, clearCache);

export default router;