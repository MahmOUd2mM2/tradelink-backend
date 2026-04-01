import { Router } from 'express';
import { askCoPilot } from '../controllers/copilot';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/ask', authenticate, askCoPilot);

export default router;
