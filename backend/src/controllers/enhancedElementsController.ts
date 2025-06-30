import { Request, Response } from 'express';
import { db } from '../config/database';
import { pubchemService } from '../services/pubchemService';
import { Element } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export const getAllElements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { enhanced } = req.query;
  
  let elements = await db.read('elements');

  // If enhanced data is requested, try to enrich with PubChem data
  if (enhanced === 'true') {
    const enrichedElements = await Promise.allSettled(
      elements.map(async (element: Element) => {
        try {
          const pubchemData = await pubchemService.getElementBySymbol(element.symbol);
          return pubchemData ? { ...element, ...pubchemData } : element;
        } catch (error) {
          console.warn(`Failed to enrich element ${element.symbol}:`, error);
          return element;
        }
      })
    );

    elements = enrichedElements.map(result => 
      result.status === 'fulfilled' ? result.value : elements.find(e => e.symbol === (result as any).reason?.symbol)
    );
  }

  res.json({
    success: true,
    data: elements,
    enhanced: enhanced === 'true',
    timestamp: new Date().toISOString()
  });
});

export const getElementById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { symbol } = req.params;
  const { enhanced } = req.query;

  // Get element from local database
  let element = await db.findOne('elements', (e: Element) => 
    e.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!element) {
    res.status(404).json({
      success: false,
      error: 'Element not found',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Enhance with PubChem data if requested
  if (enhanced === 'true') {
    try {
      const pubchemData = await pubchemService.getElementBySymbol(symbol);
      if (pubchemData) {
        element = { ...element, ...pubchemData };
      }
    } catch (error) {
      console.warn(`Failed to enhance element ${symbol} with PubChem data:`, error);
    }
  }

  res.json({
    success: true,
    data: element,
    enhanced: enhanced === 'true',
    timestamp: new Date().toISOString()
  });
});

export const searchElements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q, category, group, period, enhanced } = req.query;

  let elements = await db.read('elements');

  // Filter by search query
  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    elements = elements.filter((e: Element) =>
      e.name.toLowerCase().includes(query) ||
      e.symbol.toLowerCase().includes(query) ||
      e.uses.some(use => use.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (category && typeof category === 'string') {
    elements = elements.filter((e: Element) => e.category === category);
  }

  // Filter by group
  if (group && typeof group === 'string') {
    const groupNum = parseInt(group);
    elements = elements.filter((e: Element) => e.group === groupNum);
  }

  // Filter by period
  if (period && typeof period === 'string') {
    const periodNum = parseInt(period);
    elements = elements.filter((e: Element) => e.period === periodNum);
  }

  // Enhance with PubChem data if requested
  if (enhanced === 'true') {
    const enrichedElements = await Promise.allSettled(
      elements.slice(0, 20).map(async (element: Element) => { // Limit to 20 for performance
        try {
          const pubchemData = await pubchemService.getElementBySymbol(element.symbol);
          return pubchemData ? { ...element, ...pubchemData } : element;
        } catch (error) {
          return element;
        }
      })
    );

    elements = enrichedElements.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean);
  }

  res.json({
    success: true,
    data: elements,
    count: elements.length,
    enhanced: enhanced === 'true',
    timestamp: new Date().toISOString()
  });
});

export const getElementCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const elements = await db.read('elements');
  const categories = [...new Set(elements.map((e: Element) => e.category))];

  res.json({
    success: true,
    data: categories,
    timestamp: new Date().toISOString()
  });
});

export const searchCompounds = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { q, limit } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Search query is required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const limitNum = limit ? parseInt(limit as string) : 10;
  
  try {
    const compounds = await pubchemService.searchCompounds(q, limitNum);
    
    res.json({
      success: true,
      data: compounds,
      count: compounds.length,
      query: q,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search compounds',
      timestamp: new Date().toISOString()
    });
  }
});

export const getCompound = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  try {
    const compound = await pubchemService.getCompoundByName(name);
    
    if (!compound) {
      res.status(404).json({
        success: false,
        error: 'Compound not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: compound,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compound data',
      timestamp: new Date().toISOString()
    });
  }
});

export const getCacheStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const pubchemStats = pubchemService.getCacheStats();
  
  res.json({
    success: true,
    data: {
      pubchem: pubchemStats
    },
    timestamp: new Date().toISOString()
  });
});

export const clearCache = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  pubchemService.clearCache();
  
  res.json({
    success: true,
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});