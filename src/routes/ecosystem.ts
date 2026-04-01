import { Router } from 'express';
import { getIntegrations, generateApiKey } from '../controllers/ecosystem';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/plugins', authenticate, getIntegrations);
router.post('/keys/generate', authenticate, generateApiKey);

export default router;
