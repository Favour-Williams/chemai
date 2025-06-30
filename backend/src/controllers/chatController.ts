import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { aiChatService } from '../services/aiChatService';
import { ChatMessage, ChatConversation } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { message, conversationId, context } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Message is required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const userId = req.user?.id || 'anonymous';

  try {
    // Generate AI response
    const aiResponse = await aiChatService.generateResponse(message, context);

    // Create chat message
    const chatMessage = {
      id: uuidv4(),
      user_id: userId,
      message: message.trim(),
      response: aiResponse.response,
      timestamp: new Date().toISOString(),
      context,
      rating: undefined
    };

    // Handle conversation
    let conversation: any;
    
    if (conversationId) {
      // Add to existing conversation
      const { data: existingConv, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
      
      if (convError || !existingConv) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      conversation = existingConv;
      
      // Insert message
      await supabase
        .from('chat_messages')
        .insert([{ ...chatMessage, conversation_id: conversationId }]);

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      // Create new conversation
      const newConversation = {
        id: uuidv4(),
        user_id: userId,
        title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .insert([newConversation])
        .select()
        .single();

      if (convError) {
        throw convError;
      }

      conversation = convData;
      
      // Insert message
      await supabase
        .from('chat_messages')
        .insert([{ ...chatMessage, conversation_id: conversation.id }]);
    }

    res.json({
      success: true,
      data: {
        message: chatMessage,
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        aiResponse: {
          confidence: aiResponse.confidence,
          source: aiResponse.source
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      timestamp: new Date().toISOString()
    });
  }
});

export const getConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || 'anonymous';
  const { limit, offset } = req.query;

  const limitNum = limit ? parseInt(limit as string) : 20;
  const offsetNum = offset ? parseInt(offset as string) : 0;

  const { data: conversations, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1);

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Get message counts for each conversation
  const conversationSummaries = await Promise.all(
    conversations.map(async (conv) => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('message')
        .eq('conversation_id', conv.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      return {
        id: conv.id,
        title: conv.title,
        messageCount: count || 0,
        lastMessage: lastMessage?.message?.substring(0, 100) + '...' || '',
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      };
    })
  );

  res.json({
    success: true,
    data: conversationSummaries,
    total: conversations.length,
    limit: limitNum,
    offset: offsetNum,
    timestamp: new Date().toISOString()
  });
});

export const getConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id || 'anonymous';

  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (convError || !conversation) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('timestamp', { ascending: true });

  if (msgError) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: {
      ...conversation,
      messages
    },
    timestamp: new Date().toISOString()
  });
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id || 'anonymous';

  const { error } = await supabase
    .from('chat_conversations')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    res.status(404).json({
      success: false,
      error: 'Conversation not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    message: 'Conversation deleted successfully',
    timestamp: new Date().toISOString()
  });
});

export const rateMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { conversationId, messageId } = req.params;
  const { rating } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({
      success: false,
      error: 'Rating must be between 1 and 5',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({ rating })
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    res.status(404).json({
      success: false,
      error: 'Message not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    message: 'Message rated successfully',
    timestamp: new Date().toISOString()
  });
});

export const getChatStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const aiCacheStats = aiChatService.getCacheStats();
  
  const { count: totalConversations } = await supabase
    .from('chat_conversations')
    .select('*', { count: 'exact', head: true });

  const { count: activeConversations } = await supabase
    .from('chat_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalMessages } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true });

  res.json({
    success: true,
    data: {
      totalConversations: totalConversations || 0,
      activeConversations: activeConversations || 0,
      totalMessages: totalMessages || 0,
      aiCache: aiCacheStats
    },
    timestamp: new Date().toISOString()
  });
});

export const clearChatCache = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  aiChatService.clearCache();
  
  res.json({
    success: true,
    message: 'Chat cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});