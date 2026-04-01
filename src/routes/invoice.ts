import { Router } from 'express';
import { getInvoices, getInvoiceById, updateInvoiceStatus } from '../controllers/invoice';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.patch('/:id/status', authenticate, updateInvoiceStatus);

export default router;
