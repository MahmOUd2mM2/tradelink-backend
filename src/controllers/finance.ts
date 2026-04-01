import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { FinancialService } from '../services/FinancialService';
import prisma from '../prisma';

export const getWalletStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: userId },
      include: { 
        transactions: { 
          orderBy: { created_at: 'desc' }, 
          take: 10 
        } 
      }
    });

    if (!wallet) {
      // Auto-create wallet if missing (Safe for demo/onboarding)
      const newWallet = await prisma.wallet.create({
        data: { user_id: userId || 0, balance: 10000 } // Initial demo balance
      });
      res.json(newWallet);
      return;
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet stats' });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const history = await FinancialService.getTransactionHistory(wallet.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount, description, channel } = req.body;

    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    if (Number(wallet.balance) < Number(amount)) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    const result = await FinancialService.createTransaction(wallet.id, 'withdrawal', Number(amount), description, channel);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error requesting withdrawal' });
  }
};

export const requestDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount, description, channel } = req.body;

    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const result = await FinancialService.createTransaction(wallet.id, 'deposit', Number(amount), description, channel);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error requesting deposit' });
  }
};

export const approveTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId, status } = req.body; // status: 'completed' | 'failed'
    const adminId = req.user?.userId;

    const result = await FinancialService.updateTransactionStatus(Number(transactionId), status, adminId);
    res.json({ message: `Transaction ${status}`, result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createEncryptedInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { order_id, amount } = req.body;
    const sellerId = req.user?.userId;

    const mockHash = Buffer.from(`inv-${order_id}-${Date.now()}`).toString('base64').substring(0, 8);
    const invoice = await prisma.invoice.create({
      data: {
        order_id: Number(order_id),
        amount: Number(amount),
        invoice_number: `INV-${mockHash.toUpperCase()}`,
        status: 'unpaid'
      }
    });

    res.status(201).json({ message: 'Invoice created', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice' });
  }
};
