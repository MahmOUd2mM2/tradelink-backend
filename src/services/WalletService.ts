import prisma from '../prisma';

export interface WalletTransaction {
  id: number;
  userId: number;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  signature: string;
  created_at: string;
}

export class WalletService {
  /**
   * Phase 4: Immutable Transaction History
   * Records a wallet movement with a digital signature (Blockchain Simulation)
   */
  static async recordTransaction(userId: number, amount: number, type: WalletTransaction['type'], status: WalletTransaction['status'] = 'COMPLETED') {
    const signature = `TX-${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return await prisma.immutableLog.create({
      data: {
        entity_type: 'Wallet_Transaction',
        entity_id: userId,
        action: type,
        new_state: JSON.stringify({ amount, status }),
        signature
      }
    });
  }

  /**
   * Phase 4: Deposit/Withdrawal Management
   * Initiates a request for funding or payout
   */
  static async requestMovement(userId: number, amount: number, type: 'DEPOSIT' | 'WITHDRAWAL') {
    const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
    if (!wallet) throw new Error('Wallet not found');

    if (type === 'WITHDRAWAL' && Number(wallet.balance) < amount) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // Records the pending movement in the audit log
    const tx = await this.recordTransaction(userId, amount, type, 'PENDING');

    return {
      transactionId: tx.id,
      message: type === 'DEPOSIT' ? 'تم استلام طلب الإيداع. يرجى إرسال المبلغ عبر فودافون كاش.' : 'تم تسجيل طلب السحب. سيتم التحصيل خلال 24 ساعة.',
      status: 'PENDING'
    };
  }

  /**
   * Approves a pending movement (Admin tool)
   */
  static async approveMovement(adminId: number, transactionId: number) {
    const log = await prisma.immutableLog.findUnique({ where: { id: transactionId } });
    if (!log || log.entity_type !== 'Wallet_Transaction') throw new Error('Transaction not found');

    const state = JSON.parse(log.new_state || '{}');
    if (state.status !== 'PENDING') throw new Error('Transaction already processed');

    const userId = log.entity_id;
    const amount = state.amount;
    const type = log.action;

    return await prisma.$transaction(async (tx) => {
      // 1. Update Wallet
      if (type === 'DEPOSIT') {
        await tx.wallet.update({
          where: { user_id: userId },
          data: { balance: { increment: amount } }
        });
      } else if (type === 'WITHDRAWAL') {
        const wallet = await tx.wallet.findUnique({ where: { user_id: userId } });
        if (Number(wallet?.balance || 0) < amount) throw new Error('Insufficient balance');
        
        await tx.wallet.update({
          where: { user_id: userId },
          data: { balance: { decrement: amount } }
        });
      }

      // 2. Finalize Log
      await tx.immutableLog.update({
        where: { id: transactionId },
        data: { 
          new_state: JSON.stringify({ amount, status: 'APPROVED', adminId }),
          signature: `${log.signature}-APPROVED`
        }
      });

      return { success: true, message: 'Transaction approved and balance updated' };
    });
  }

  /**
   * Phase 5: Reputation-Based Credit Eligibility
   * Determines if a user can use "Deferred Payment" (Pay Later)
   */
  static async checkCreditEligibility(userId: number) {
    const { ReputationService } = require('./ReputationService'); // Dynamic import to avoid circular dep
    const rep = await ReputationService.calculateTradeScore(userId);
    
    const isEligible = rep.score >= 70;
    let creditLimit = 0;

    if (rep.score > 90) creditLimit = 500000;
    else if (rep.score > 80) creditLimit = 150000;
    else if (rep.score >= 70) creditLimit = 50000;

    return {
      userId,
      isEligible,
      creditLimit,
      level: rep.level,
      badge: rep.badge,
      insight: isEligible 
        ? `✅ مبروك! تقييمك (${rep.score}) يسمح لك بالشراء الآجل بحد ائتماني ${creditLimit.toLocaleString()} ج.م.`
        : `❌ تقييمك (${rep.score}) غير كافٍ للحصول على ائتمان حالياً. نوصي بتحسين معدل التسليم.`
    };
  }

  /**
   * Phase 5: Deferred Payment Commitment
   * Allows high-reputation users to commit to a payment later.
   */
  static async commitToDeferredPayment(userId: number, orderId: number, amount: number) {
    const eligibility = await this.checkCreditEligibility(userId);
    if (!eligibility.isEligible) throw new Error('User not eligible for credit');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyer_id !== userId) throw new Error('Order not found or unauthorized');

    if (amount > eligibility.creditLimit) throw new Error('Order amount exceeds credit limit');

    return await prisma.$transaction(async (tx) => {
      // 1. Mark Order as "Committed"
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' } // In industrial logic, 'paid_by_credit' or similar
      });

      // 2. Create a pending Payment tied to the "Credit" type
      const payment = await tx.payment.create({
        data: {
          order_id: orderId,
          method: 'CREDIT_DEFERRED',
          amount,
          status: 'pending', // Pending real cash settlement
          transaction_ref: `CRED-${Date.now()}`
        }
      });

      // 3. Log the credit movement
      await tx.immutableLog.create({
        data: {
          entity_type: 'Credit_Line',
          entity_id: userId,
          action: 'DEFERRED_COMMITMENT',
          new_state: JSON.stringify({ orderId, amount, eligibilityLimit: eligibility.creditLimit }),
          signature: `CRED-SIG-${Date.now()}`
        }
      });

      return {
        success: true,
        paymentId: payment.id,
        message: '🤝 تم تفعيل الدفع الآجل! تم تأكيد طلبك وسيبدأ المورد بالتجهيز فوراً.'
      };
    });
  }
}
