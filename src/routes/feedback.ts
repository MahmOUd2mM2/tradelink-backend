import express from 'express';
import { authenticate } from '../middlewares/auth';
import { submitFeedback, getAdminFeedbacks, resolveFeedback } from '../controllers/feedback';

const router = express.Router();

router.post('/', authenticate, submitFeedback);
router.get('/admin', authenticate, getAdminFeedbacks);
router.patch('/:id/resolve', authenticate, resolveFeedback);

export default router;
