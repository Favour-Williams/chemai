import { Request, Response } from 'express';
import { db } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export const getAllElements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const elements = await db.getAllElements();

  res.json({
    success: true,
    data: elements,
    timestamp: new Date().toISOString()
  });
});

export const getElementById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { symbol } = req.params;

  const element = await db.findElementBySymbol(symbol);

  if (!element) {
    res.status(404).json({
      success: false,
      error: 'Element not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: element,
    timestamp: new Date().toISOString()
  });
});

export const searchElements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q, category, group, period } = req.query;

  const filters: any = {};
  if (q && typeof q === 'string') filters.search = q;
  if (category && typeof category === 'string') filters.category = category;
  if (group && typeof group === 'string') filters.group = parseInt(group);
  if (period && typeof period === 'string') filters.period = parseInt(period);

  const elements = await db.searchElements(filters);

  res.json({
    success: true,
    data: elements,
    count: elements.length,
    timestamp: new Date().toISOString()
  });
});

export const getElementCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const elements = await db.getAllElements();
  const categories = [...new Set(elements.map((e: any) => e.category))];

  res.json({
    success: true,
    data: categories,
    timestamp: new Date().toISOString()
  });
});