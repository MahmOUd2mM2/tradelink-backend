import { Request, Response } from 'express';
import { PluginMetaService } from '../services/PluginMetaService';
import { AuthRequest } from '../middlewares/auth';

export const getIntegrations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const list = await PluginMetaService.getActiveIntegrations(userId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Ecosystem error' });
  }
};

export const generateApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { label } = req.body;

    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const keyData = await PluginMetaService.generateEcosystemKey(userId, label || 'Default Key');
    res.json(keyData);
  } catch (error) {
    res.status(500).json({ message: 'Key generation error' });
  }
};
