import { Router } from 'express';
import { getNearbyRetailers, placeB2COrder } from '../controllers/storefront';

const router = Router();

router.get('/nearby', getNearbyRetailers);
router.post('/checkout', placeB2COrder);

export default router;
