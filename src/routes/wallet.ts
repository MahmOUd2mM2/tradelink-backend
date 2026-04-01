import { Router } from 'express';
import { getWallet, deposit, withdraw, payInvoice, requestDepositWithdrawal, approveWalletAction } from '../controllers/wallet';

const router = Router();

router.get('/', getWallet);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/pay', payInvoice);
router.post('/request-movement', requestDepositWithdrawal);
router.post('/approve-movement', approveWalletAction);

export default router;
