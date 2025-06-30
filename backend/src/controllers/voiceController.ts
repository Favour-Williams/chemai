import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { voiceService } from '../services/voiceService';
import { VoiceMessage, AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const synthesizeText = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { text, voice = 'neutral', speed = 1.0, language = 'en' } = req.body;

  try {
    const audioData = await voiceService.synthesizeText(text, {
      voice,
      speed,
      language
    });

    res.json({
      success: true,
      data: {
        audioUrl: audioData.url,
        duration: audioData.duration,
        format: audioData.format
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Text synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize text',
      timestamp: new Date().toISOString()
    });
  }
});

export const processVoiceMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { transcript, context } = req.body;
  const audioFile = req.file;

  if (!audioFile && !transcript) {
    res.status(400).json({
      success: false,
      error: 'Either audio file or transcript is required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    let processedTranscript = transcript;
    
    // If audio file is provided, transcribe it
    if (audioFile) {
      processedTranscript = await voiceService.transcribeAudio(audioFile.path);
    }

    // Process the voice message for chemistry context
    const response = await voiceService.processChemistryVoiceMessage(processedTranscript, context);

    // Save voice message to database
    const voiceMessage: VoiceMessage = {
      id: uuidv4(),
      userId: req.user?.id || 'anonymous',
      transcript: processedTranscript,
      response: response.text,
      audioPath: audioFile?.path,
      context,
      timestamp: new Date().toISOString(),
      confidence: response.confidence
    };

    await db.insert('voiceMessages', voiceMessage);

    // Generate audio response if requested
    let audioResponse = null;
    if (req.body.generateAudio) {
      audioResponse = await voiceService.synthesizeText(response.text, {
        voice: 'neutral',
        speed: 1.0,
        language: 'en'
      });
    }

    res.json({
      success: true,
      data: {
        transcript: processedTranscript,
        response: response.text,
        confidence: response.confidence,
        audioResponse,
        messageId: voiceMessage.id
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process voice message',
      timestamp: new Date().toISOString()
    });
  }
});

export const getVoiceHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const { limit, offset } = req.query;

  const voiceMessages = await db.findMany('voiceMessages', (vm: VoiceMessage) => 
    vm.userId === userId
  );

  // Sort by timestamp
  voiceMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const limitNum = limit ? parseInt(limit as string) : 20;
  const offsetNum = offset ? parseInt(offset as string) : 0;
  const paginatedMessages = voiceMessages.slice(offsetNum, offsetNum + limitNum);

  res.json({
    success: true,
    data: paginatedMessages,
    total: voiceMessages.length,
    limit: limitNum,
    offset: offsetNum,
    timestamp: new Date().toISOString()
  });
});

export const deleteVoiceMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id || 'anonymous';

  const deleted = await db.delete('voiceMessages', (vm: VoiceMessage) => 
    vm.id === id && vm.userId === userId
  );

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Voice message not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    message: 'Voice message deleted successfully',
    timestamp: new Date().toISOString()
  });
});