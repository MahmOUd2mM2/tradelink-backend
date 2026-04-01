import { Router } from 'express';
import { getAvailableRentals, requestRental } from '../controllers/warehouse-rental';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/listings', authenticate, getAvailableRentals);
router.post('/request', authenticate, requestRental);

export default router;
