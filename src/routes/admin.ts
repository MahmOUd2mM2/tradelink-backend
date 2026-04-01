import { Router } from 'express';
import { getAdminStats, resolveFeedback } from '../controllers/admin';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticate, getAdminStats);
router.post('/feedback/:id/resolve', authenticate, resolveFeedback);

export default router;
