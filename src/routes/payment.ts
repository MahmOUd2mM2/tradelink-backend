import { Router } from 'express';
import { createPayment, getPayments, getPaymentById, updatePaymentStatus } from '../controllers/payment';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createPayment);
router.get('/', authenticate, getPayments);
router.get('/:id', authenticate, getPaymentById);
router.patch('/:id/status', authenticate, updatePaymentStatus);

export default router;
