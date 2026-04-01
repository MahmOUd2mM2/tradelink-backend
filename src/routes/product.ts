import { Router } from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from '../controllers/product';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, getProducts);
router.post('/', authenticate, authorizeRoles('Supplier'), createProduct);
router.get('/:id', authenticate, getProductById);
router.put('/:id', authenticate, authorizeRoles('Supplier'), updateProduct);
router.delete('/:id', authenticate, authorizeRoles('Supplier', 'Admin'), deleteProduct);

export default router;
