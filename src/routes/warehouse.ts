import { Router } from 'express';
import { createWarehouse, getWarehouses, getWarehouseById, updateWarehouse, deleteWarehouse } from '../controllers/warehouse';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createWarehouse);
router.get('/', authenticate, getWarehouses);
router.get('/:id', authenticate, getWarehouseById);
router.put('/:id', authenticate, updateWarehouse);
router.delete('/:id', authenticate, deleteWarehouse);

export default router;
