import { Request, Response } from 'express';
import { AlternativeSupplierEngine } from '../services/AlternativeSupplierEngine';
import { AuthRequest } from '../middlewares/auth';

export const getAlternativeSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, currentSupplierId } = req.query;
    if (!productId || !currentSupplierId) {
      res.status(400).json({ message: 'productId and currentSupplierId are required' });
      return;
    }

    const suggestions = await AlternativeSupplierEngine.findAlternatives(Number(productId), Number(currentSupplierId));
    res.json(suggestions);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};
