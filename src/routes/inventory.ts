import { Router } from 'express';
import { getInventory, addInventory, adjustStock, simulateOCR, confirmOCR } from '../controllers/inventory';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getInventory);
router.post('/', authenticate, addInventory);
router.patch('/:id', authenticate, adjustStock);
router.post('/ocr', authenticate, simulateOCR);
router.post('/ocr/confirm', authenticate, confirmOCR);

export default router;
