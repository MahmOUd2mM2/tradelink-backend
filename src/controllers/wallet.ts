import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WalletService } from '../services/WalletService';

const prisma = new PrismaClient();

export const getWallet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let wallet = await prisma.wallet.findUnique({
      where: { user_id: Number(userId) },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          user_id: Number(userId),
          balance: 0,
          currency: 'EGP'
        },
        include: {
          transactions: true
        }
      });
    }

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deposit = async (req: Request, res: Response) => {
  try {
    const { userId, amount, channel, reference } = req.body;

    const wallet = await prisma.wallet.update({
      where: { user_id: Number(userId) },
      data: {
        balance: { increment: amount },
        transactions: {
          create: {
            type: 'DEPOSIT',
            amount: amount,
            status: 'completed',
            channel: channel || 'InstaPay',
            reference: reference || `DEP-${Date.now()}`,
            description: `Deposit via ${channel || 'InstaPay'}`
          }
        }
      },
      include: { transactions: true }
    });

    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const { userId, amount, channel, otpCode } = req.body;

    // 1. Mandatory OTP Verification for Withdrawal
    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: Number(userId),
        code: otpCode,
        type: 'WITHDRAW',
        expires_at: { gt: new Date() }
      }
    });

    if (!otp) {
       return res.status(400).json({ error: 'رمز التحقق (OTP) غير صحيح أو انتهى' });
    }

    // Phase 35: Biometric Authorization (Mock)
    const { biometricToken } = req.body;
    if (amount > 10000 && !biometricToken) {
       return res.status(403).json({ 
         error: 'يتطلب هذا المبلغ تصديقاً بيومترياً (FaceID/TouchID)',
         requiresBiometric: true 
       });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: Number(userId) }
    });

    if (!wallet || Number(wallet.balance) < amount) {
      return res.status(400).json({ error: 'رصيد غير كافٍ' });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { user_id: Number(userId) },
      data: {
        balance: { decrement: amount },
        transactions: {
          create: {
            type: 'WITHDRAW',
            amount: amount,
            status: 'completed',
            channel: channel || 'Vodafone Cash',
            reference: `WTH-${Date.now()}`,
            description: `Withdrawal to ${channel || 'Digital Wallet'}`
          }
        }
      },
      include: { transactions: true }
    });

    // Clean up OTP after successful withdrawal
    await prisma.oTP.deleteMany({ where: { user_id: Number(userId), type: 'WITHDRAW' } });

    res.json(updatedWallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const payInvoice = async (req: Request, res: Response) => {
  try {
    const { userId, invoiceId, otpCode } = req.body;

    if (!otpCode) {
      return res.status(400).json({ error: 'مطلوب رمز التحقق (OTP) لإتمام عملية الدفع' });
    }

    // 🛡️ Security: Enforce OTP for all payments
    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: Number(userId),
        code: otpCode,
        type: 'PAYMENT',
        expires_at: { gt: new Date() }
      }
    });

    if (!otp) {
      return res.status(400).json({ error: 'رمز التحقق (OTP) غير صحيح أو انتهى. الرجاء طلب رمز جديد.' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
      include: { order: true }
    });

    if (!invoice || invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invalid or already paid invoice' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { user_id: Number(userId) }
    });

    if (!wallet || Number(wallet.balance) < Number(invoice.amount)) {
      return res.status(400).json({ error: 'Insufficient balance in TradeLink Cash' });
    }

    // Phase 35: Biometric Authorization (Mock)
    const { biometricToken } = req.body;
    if (Number(invoice.amount) > 50000 && !biometricToken) {
       return res.status(403).json({ 
         error: 'عملية دفع كبيرة! مطلوب التحقق البيومتري للأمان',
         requiresBiometric: true 
       });
    }

    // Consumed the OTP
    await prisma.oTP.deleteMany({ where: { user_id: Number(userId), type: 'PAYMENT' } });

    const sellerId = invoice.order.seller_id;

    // Ensure seller has a wallet
    await prisma.wallet.upsert({
      where: { user_id: sellerId },
      update: {},
      create: { user_id: sellerId, balance: 0, escrow_balance: 0 }
    });

    // Atomic transaction: Pay invoice and move to escrow
    const result = await prisma.$transaction([
      // Deduct from buyer
      prisma.wallet.update({
        where: { user_id: Number(userId) },
        data: {
          balance: { decrement: invoice.amount },
          transactions: {
            create: {
              type: 'PAYMENT',
              amount: invoice.amount,
              status: 'completed',
              reference: `INV-PAY-${invoice.invoice_number}`,
              description: `Payment for Invoice ${invoice.invoice_number} (Safe Escrow)`
            }
          }
        }
      }),
      // Move to seller's escrow
      prisma.wallet.update({
        where: { user_id: sellerId },
        data: {
          escrow_balance: { increment: invoice.amount },
          transactions: {
            create: {
              type: 'DEPOSIT', // Using DEPOSIT as a placeholder or we could add 'ESCROW' type
              amount: invoice.amount,
              status: 'pending',
              reference: `ESC-IN-${invoice.invoice_number}`,
              description: `Escrow funds for Invoice ${invoice.invoice_number}`
            }
          }
        }
      }),
      prisma.invoice.update({
        where: { id: Number(invoiceId) },
        data: { status: 'paid' }
      }),
      prisma.order.update({
        where: { id: invoice.order_id },
        data: { status: 'paid' }
      })
    ]);

    res.json({ message: 'Payment successful (Held in Escrow)', wallet: result[0], invoice: result[2] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestDepositWithdrawal = async (req: Request, res: Response) => {
  try {
    const { userId, amount, type } = req.body;
    const result = await WalletService.requestMovement(Number(userId), Number(amount), type as 'DEPOSIT' | 'WITHDRAWAL');
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveWalletAction = async (req: Request, res: Response) => {
  try {
    const { transactionId, adminId } = req.body;
    const result = await WalletService.approveMovement(Number(adminId), Number(transactionId));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
