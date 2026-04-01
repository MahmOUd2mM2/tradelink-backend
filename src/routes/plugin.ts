import { Router } from 'express';
import { getIntegrations, generateApiKey } from '../controllers/plugin';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/list', authenticate, authorizeRoles('Admin', 'Wholesaler', 'Supplier'), getIntegrations);
router.post('/keygen', authenticate, authorizeRoles('Admin', 'Wholesaler', 'Supplier'), generateApiKey);

export default router;
