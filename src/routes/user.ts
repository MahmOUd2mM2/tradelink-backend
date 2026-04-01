import { Router } from 'express';
import { getUsers, getUserById, getProfile, updateUserStatus, getSuppliers, updateProfile } from '../controllers/user';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/suppliers/search', authenticate, getSuppliers);
router.get('/', authenticate, authorizeRoles('Admin'), getUsers);
router.get('/:id', authenticate, authorizeRoles('Admin'), getUserById);
router.patch('/:id/status', authenticate, authorizeRoles('Admin'), updateUserStatus);

export default router;
