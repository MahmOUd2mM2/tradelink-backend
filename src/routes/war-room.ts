import { Router } from 'express';
import { getWarRoomStats } from '../controllers/war-room';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticate, getWarRoomStats);

export default router;
