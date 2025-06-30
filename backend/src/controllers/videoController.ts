import { Request, Response } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { videoService } from '../services/videoService';
import { VideoJob, AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const generateReactionVideo = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { 
    reactionId, 
    equation, 
    style = 'molecular', 
    duration = 15, 
    quality = 'medium' 
  } = req.body;

  if (!reactionId && !equation) {
    res.status(400).json({
      success: false,
      error: 'Either reactionId or equation is required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    let reaction = null;
    
    if (reactionId) {
      reaction = await db.findOne('reactions', (r: any) => r.id === reactionId);
      if (!reaction) {
        res.status(404).json({
          success: false,
          error: 'Reaction not found',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    const jobId = uuidv4();
    const videoJob: VideoJob = {
      id: jobId,
      userId: req.user?.id || 'anonymous',
      reactionId,
      equation: equation || reaction?.equation,
      style,
      duration,
      quality,
      status: 'pending',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    await db.insert('videoJobs', videoJob);

    // Start video generation in background
    videoService.generateVideo(videoJob).catch(error => {
      console.error('Video generation error:', error);
    });

    res.json({
      success: true,
      data: {
        jobId,
        status: 'pending',
        estimatedTime: duration * 2 // Rough estimate
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Video generation request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video generation',
      timestamp: new Date().toISOString()
    });
  }
});

export const getVideoStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await db.findOne('videoJobs', (j: VideoJob) => j.id === jobId);

  if (!job) {
    res.status(404).json({
      success: false,
      error: 'Video job not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      videoUrl: job.videoUrl,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    },
    timestamp: new Date().toISOString()
  });
});

export const getVideo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { videoId } = req.params;

  try {
    const videoBuffer = await videoService.getVideoFile(videoId);
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `inline; filename="${videoId}.mp4"`);
    res.send(videoBuffer);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Video not found',
      timestamp: new Date().toISOString()
    });
  }
});

export const deleteVideo = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { videoId } = req.params;
  const userId = req.user?.id || 'anonymous';

  const job = await db.findOne('videoJobs', (j: VideoJob) => 
    j.videoUrl?.includes(videoId) && j.userId === userId
  );

  if (!job) {
    res.status(404).json({
      success: false,
      error: 'Video not found or not authorized',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    await videoService.deleteVideo(videoId);
    
    // Update job status
    await db.update('videoJobs',
      (j: VideoJob) => j.id === job.id,
      (j: VideoJob) => ({ ...j, status: 'deleted' })
    );

    res.json({
      success: true,
      message: 'Video deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete video',
      timestamp: new Date().toISOString()
    });
  }
});

export const getVideoTemplates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const templates = await videoService.getVideoTemplates();

  res.json({
    success: true,
    data: templates,
    timestamp: new Date().toISOString()
  });
});