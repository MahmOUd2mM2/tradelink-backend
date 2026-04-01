import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PluginMetaService } from '../services/PluginMetaService';

export const getIntegrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const integrations = await PluginMetaService.getActiveIntegrations(userId);
    res.status(200).json(integrations);
  } catch (error) {
    console.error('getIntegrations Error:', error);
    res.status(500).json({ message: 'Error fetching integrations' });
  }
};

export const generateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { label } = req.body;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const keyData = await PluginMetaService.generateEcosystemKey(userId, label || 'Default API Key');
    res.status(201).json(keyData);
  } catch (error) {
    console.error('generateApiKey Error:', error);
    res.status(500).json({ message: 'Error generating API key' });
  }
};
