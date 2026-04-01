import { Router } from 'express';
import { 
  getBackhaulOptimization, 
  getMerchantTradeScore, 
  startDigitalCoop, 
  autoInventoryOCR 
} from '../controllers/ecosystem-bridge';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/backhaul', authenticate, getBackhaulOptimization);
router.get('/trade-score', authenticate, getMerchantTradeScore);
router.post('/coop/start', authenticate, startDigitalCoop);
router.post('/ocr/auto-inventory', authenticate, autoInventoryOCR);

export default router;
