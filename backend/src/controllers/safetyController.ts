import { Request, Response } from 'express';
import { db } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export const getSafetyData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { symbol } = req.params;

  const safetyData = await db.findSafetyDataBySymbol(symbol);

  if (!safetyData) {
    res.status(404).json({
      success: false,
      error: 'Safety data not found for this element',
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.json({
    success: true,
    data: safetyData,
    timestamp: new Date().toISOString()
  });
});

export const getAllSafetyData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { hazardLevel } = req.query;

  let safetyData = await db.getAllSafetyData();

  // Filter by hazard level
  if (hazardLevel && typeof hazardLevel === 'string') {
    safetyData = safetyData.filter((s: any) => s.hazard_level === hazardLevel);
  }

  res.json({
    success: true,
    data: safetyData,
    timestamp: new Date().toISOString()
  });
});