import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { SpecializationService } from '../services/SpecializationService';

export const getSpecializedInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const [expiring, risks, batches] = await Promise.all([
      SpecializationService.getExpiringStock(userId),
      SpecializationService.getInventoryRisks(userId),
      SpecializationService.getBatchStatus(userId)
    ]);

    res.status(200).json({
      expiring,
      risks,
      batches,
      sectorAdvice: expiring.length > 10 ? "⚠️ تحذير: قطاع الـ FMCG الخاص بك لديه كميات كبيرة قاربت على الانتهاء. ننصح بعمل 'Bulk Deal' لتصريفها." : "✅ إدارة المخزون مستقرة."
    });
  } catch (error) {
    console.error('getSpecializedInsights Error:', error);
    res.status(500).json({ message: 'Error fetching specialized insights' });
  }
};
