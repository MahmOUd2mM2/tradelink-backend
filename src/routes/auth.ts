import { Router } from 'express';
import { register, login, registerOTP } from '../controllers/auth';

const router = Router();

router.post('/register', register);
router.post('/register-otp', registerOTP);
router.post('/login', login);

export default router;
