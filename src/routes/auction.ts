import { Router } from 'express';
import { createAuction, getAuctions, placeBid, awardAuction } from '../controllers/auction';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/create', authenticate, createAuction);
router.get('/list', authenticate, getAuctions);
router.post('/bid', authenticate, placeBid);
router.post('/award', authenticate, awardAuction);

export default router;
