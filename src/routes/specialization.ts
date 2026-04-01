import { Router } from 'express';
import { getSpecializedInsights } from '../controllers/specialization';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/insights', authenticate, getSpecializedInsights);

export default router;
