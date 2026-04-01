import { Router } from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder } from '../controllers/order';
import { verifyFulfillment } from '../controllers/escrow';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.post('/:id/verify', authenticate, verifyFulfillment);
router.delete('/:id', authenticate, cancelOrder);

export default router;
