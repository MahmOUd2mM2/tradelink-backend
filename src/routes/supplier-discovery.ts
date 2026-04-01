import { Router } from 'express';
import { getAlternativeSuppliers } from '../controllers/supplier-discovery';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/alternatives', authenticate, getAlternativeSuppliers);

export default router;
