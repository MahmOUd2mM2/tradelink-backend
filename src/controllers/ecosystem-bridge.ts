import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { LogisticsService } from '../services/LogisticsService';
import { ReputationService } from '../services/ReputationService';
import { CoopService } from '../services/CoopService';
import { OCRService } from '../services/OCRService';

export const getBackhaulOptimization = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ message: 'lat and lng are required' });
      return;
    }
    const opportunities = await LogisticsService.getBackhaulOpportunities(
      { lat: Number(lat), lng: Number(lng) },
      radius ? Number(radius) : 20
    );
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: 'Backhaul optimization error' });
  }
};

export const getMerchantTradeScore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const score = await ReputationService.calculateTradeScore(userId);
    res.json(score);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const startDigitalCoop = async (req: AuthRequest, res: Response) => {
  try {
    const { productIds, participantIds, quantities } = req.body;
    const finalQuantities = quantities || productIds.map(() => 1);
    const result = await CoopService.createCoopOrder(productIds, participantIds, finalQuantities);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Cooperative formation error' });
  }
};

export const autoInventoryOCR = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { warehouseId, imageUrl } = req.body;

    if (!userId || !warehouseId || !imageUrl) {
      res.status(400).json({ message: 'userId, warehouseId, and imageUrl are required' });
      return;
    }

    const result = await OCRService.autoArchive(userId, warehouseId, imageUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'OCR Auto-inventory error' });
  }
};
