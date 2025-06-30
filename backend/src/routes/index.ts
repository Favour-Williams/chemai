import { Router } from 'express';
import authRoutes from './auth';
import enhancedElementsRoutes from './enhancedElements';
import reactionsRoutes from './reactions';
import safetyRoutes from './safety';
import chatRoutes from './chat';
import voiceRoutes from './voice';
import videoRoutes from './video';
import uploadRoutes from './upload';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Chemistry Platform API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      pubchemIntegration: true,
      aiChat: true,
      voiceProcessing: true,
      videoGeneration: true,
      realtimeCollaboration: true,
      fileUpload: true,
      authentication: true,
      rateLimit: true
    }
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/elements', enhancedElementsRoutes);
router.use('/reactions', reactionsRoutes);
router.use('/safety', safetyRoutes);
router.use('/chat', chatRoutes);
router.use('/voice', voiceRoutes);
router.use('/video', videoRoutes);
router.use('/upload', uploadRoutes);

export default router;