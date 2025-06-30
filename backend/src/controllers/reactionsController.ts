import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { Reaction } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const getAllReactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { type, public: isPublic, limit, offset } = req.query;

  let query = supabase.from('reactions').select('*');

  // Filter by reaction type
  if (type && typeof type === 'string') {
    query = query.eq('reaction_type', type);
  }

  // Filter by public/private
  if (isPublic !== undefined) {
    const publicFilter = isPublic === 'true';
    query = query.eq('is_public', publicFilter);
  }

  // Pagination
  const limitNum = limit ? parseInt(limit as string) : 50;
  const offsetNum = offset ? parseInt(offset as string) : 0;
  
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: reactions, error, count } = await query;

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reactions',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: reactions || [],
    total: count || 0,
    limit: limitNum,
    offset: offsetNum,
    timestamp: new Date().toISOString()
  });
});

export const getReactionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: reaction, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !reaction) {
    res.status(404).json({
      success: false,
      error: 'Reaction not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: reaction,
    timestamp: new Date().toISOString()
  });
});

export const createReaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    equation,
    reactants,
    products,
    reactionType,
    energyChange,
    temperature,
    pressure,
    catalyst,
    safetyWarnings,
    description,
    mechanism,
    yieldPercentage,
    isPublic,
    tags
  } = req.body;

  const newReaction = {
    id: uuidv4(),
    name,
    equation,
    reactants,
    products,
    reaction_type: reactionType,
    energy_change: energyChange,
    temperature,
    pressure,
    catalyst,
    safety_warnings: safetyWarnings || [],
    description,
    mechanism,
    yield_percentage: yieldPercentage,
    created_by: req.user?.id,
    created_at: new Date().toISOString(),
    is_public: isPublic !== undefined ? isPublic : true,
    tags: tags || []
  };

  const { data: reaction, error } = await supabase
    .from('reactions')
    .insert([newReaction])
    .select()
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create reaction',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: reaction,
    message: 'Reaction created successfully',
    timestamp: new Date().toISOString()
  });
});

export const updateReaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if user owns the reaction
  const { data: reaction, error: fetchError } = await supabase
    .from('reactions')
    .select('created_by')
    .eq('id', id)
    .single();

  if (fetchError || !reaction) {
    res.status(404).json({
      success: false,
      error: 'Reaction not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (reaction.created_by !== req.user?.id) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to update this reaction',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { data: updatedReaction, error } = await supabase
    .from('reactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update reaction',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: updatedReaction,
    message: 'Reaction updated successfully',
    timestamp: new Date().toISOString()
  });
});

export const deleteReaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if user owns the reaction
  const { data: reaction, error: fetchError } = await supabase
    .from('reactions')
    .select('created_by')
    .eq('id', id)
    .single();

  if (fetchError || !reaction) {
    res.status(404).json({
      success: false,
      error: 'Reaction not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (reaction.created_by !== req.user?.id) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this reaction',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('id', id);

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete reaction',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    message: 'Reaction deleted successfully',
    timestamp: new Date().toISOString()
  });
});

export const searchReactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q, reactant, product, type } = req.query;

  let query = supabase.from('reactions').select('*');

  // Filter by search query
  if (q && typeof q === 'string') {
    query = query.or(`name.ilike.%${q}%,equation.ilike.%${q}%,description.ilike.%${q}%`);
  }

  // Filter by reactant
  if (reactant && typeof reactant === 'string') {
    query = query.contains('reactants', [reactant]);
  }

  // Filter by product
  if (product && typeof product === 'string') {
    query = query.contains('products', [product]);
  }

  // Filter by reaction type
  if (type && typeof type === 'string') {
    query = query.eq('reaction_type', type);
  }

  const { data: reactions, error } = await query;

  if (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search reactions',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: reactions || [],
    count: reactions?.length || 0,
    timestamp: new Date().toISOString()
  });
});