import { Router } from 'express';
import { syncPOSSale, getMerchantBadge, submitInvoiceToTax } from '../controllers/retailer';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/pos-sync', authenticate, syncPOSSale);
router.get('/reputation', authenticate, getMerchantBadge);
router.get('/reputation/:id', authenticate, getMerchantBadge);
router.post('/tax/submit/:invoiceId', authenticate, submitInvoiceToTax);

export default router;
