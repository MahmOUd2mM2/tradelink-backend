import { Router } from 'express';
import { 
  getWalletStats, 
  getTransactionHistory, 
  requestWithdrawal, 
  requestDeposit, 
  approveTransaction,
  createEncryptedInvoice 
} from '../controllers/finance';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/wallet', authenticate, getWalletStats);
router.get('/history', authenticate, getTransactionHistory);
router.post('/deposit', authenticate, requestDeposit);
router.post('/withdraw', authenticate, requestWithdrawal);
router.post('/approve', authenticate, authorizeRoles('Admin'), approveTransaction);
router.post('/invoice', authenticate, authorizeRoles('Supplier', 'Wholesaler'), createEncryptedInvoice);

export default router;
