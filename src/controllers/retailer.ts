import { Request, Response } from 'express';
import { RetailerService } from '../services/RetailerService';
import { TaxService } from '../services/TaxService';
import { AuthRequest } from '../middlewares/auth';

export const syncPOSSale = async (req: AuthRequest, res: Response) => {
  try {
    const retailerId = req.user?.userId;
    const { warehouseId, items } = req.body;

    if (!retailerId || !warehouseId || !items) {
      res.status(400).json({ message: 'Missing POS data' });
      return;
    }

    const results = await RetailerService.recordPOSSale(retailerId, Number(warehouseId), items);
    
    // 🇪🇬 Phase 16: Automatically submit to ETA if over a certain threshold (optional)
    // res.status(200).json({ message: 'POS Sale Synced', results });
    res.json({ message: 'تم مزامنة مبيعات الكاشير بنجاح وتحديث المخزون', results });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMerchantBadge = async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = req.user?.userId || Number(req.params.id);
    const rep = await RetailerService.getMerchantReputation(merchantId);
    res.json(rep);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reputation' });
  }
};

export const submitInvoiceToTax = async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const result = await TaxService.submitToETA(Number(invoiceId));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Tax Portal error' });
  }
};
