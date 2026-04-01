import prisma from '../prisma';
import crypto from 'crypto';

export class FinancialService {
  /**
   * Generates a digital signature for a transaction to ensure immutability
   */
  static generateSignature(data: any): string {
    const secret = process.env.FINANCIAL_SECRET || 'tradelink_fintech_secure_v1';
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Creates a new financial transaction with immutable logging
   */
  static async createTransaction(walletId: number, type: 'deposit' | 'withdrawal' | 'transfer', amount: number, description: string, channel: string) {
    const reference = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        wallet_id: walletId,
        type,
        amount,
        description,
        channel,
        reference,
        status: 'pending'
      }
    });

    // 🛡️ Immutable Signature Creation
    const signature = this.generateSignature({
      id: transaction.id,
      wallet_id: walletId,
      amount: amount.toString(),
      type,
      reference,
      timestamp: transaction.created_at
    });

    await prisma.immutableLog.create({
      data: {
        entity_type: 'Transaction',
        entity_id: transaction.id,
        action: 'TRANSACTION_CREATED',
        new_state: JSON.stringify(transaction),
        signature: signature
      }
    });

    return { transaction, signature };
  }

  /**
   * Updates transaction status and triggers wallet balance updates
   */
  static async updateTransactionStatus(transactionId: number, newStatus: 'completed' | 'failed', adminId?: number) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'pending') throw new Error('Transaction is already processed');

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus }
    });

    // If completed, update the wallet balance
    if (newStatus === 'completed') {
      const amount = Number(transaction.amount);
      if (transaction.type === 'deposit') {
        await prisma.wallet.update({
          where: { id: transaction.wallet_id },
          data: { balance: { increment: amount } }
        });
      } else if (transaction.type === 'withdrawal') {
        // Ensure balance was checked earlier, but we re-check here for safety
        if (Number(transaction.wallet.balance) < amount) {
          throw new Error('Insufficient balance for withdrawal');
        }
        await prisma.wallet.update({
          where: { id: transaction.wallet_id },
          data: { balance: { decrement: amount } }
        });
      }
    }

    // 🛡️ Log the state change
    const signature = this.generateSignature({
      id: transactionId,
      status: newStatus,
      processedBy: adminId || 'SYSTEM',
      timestamp: new Date()
    });

    await prisma.immutableLog.create({
      data: {
        entity_type: 'Transaction',
        entity_id: transactionId,
        action: `TRANSACTION_${newStatus.toUpperCase()}`,
        previous_state: transaction.status,
        new_state: newStatus,
        signature: signature
      }
    });

    return updatedTransaction;
  }

  /**
   * Fetches transaction history with verification signatures
   */
  static async getTransactionHistory(walletId: number) {
    const transactions = await prisma.transaction.findMany({
      where: { wallet_id: walletId },
      orderBy: { created_at: 'desc' }
    });

    // Enrich with immutable signatures
    const enriched = await Promise.all(transactions.map(async (tx) => {
      const log = await prisma.immutableLog.findFirst({
        where: { entity_type: 'Transaction', entity_id: tx.id, action: 'TRANSACTION_CREATED' }
      });
      return {
        ...tx,
        isVerified: !!log,
        auditSignature: log?.signature?.substring(0, 16) + '...'
      };
    }));

    return enriched;
  }

  /**
   * Releases funds from escrow to the seller after successful fulfillment
   */
  static async releaseEscrow(orderId: number): Promise<boolean> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          seller: { include: { wallet: true } }, 
          buyer: { include: { wallet: true } } 
        }
      });

      if (!order || !order.seller.wallet || !order.buyer.wallet) {
        console.error(`ReleaseEscrow Failed: Missing data for order ${orderId}`);
        return false;
      }

      const amount = Number(order.total_amount);

      // Perform the transfer in a atomic transaction
      await prisma.$transaction([
        // 1. Decrement buyer escrow balance
        prisma.wallet.update({
          where: { id: order.buyer.wallet.id },
          data: { escrow_balance: { decrement: amount } }
        }),
        // 2. Increment seller real balance
        prisma.wallet.update({
          where: { id: order.seller.wallet.id },
          data: { balance: { increment: amount } }
        }),
        // 3. Create a transaction log for the seller
        prisma.transaction.create({
          data: {
            wallet_id: order.seller.wallet.id,
            type: 'deposit',
            amount: amount,
            description: `تحرير دفعية الضمان للطلب رقم #${orderId}`,
            status: 'completed',
            reference: `REL-${orderId}-${Date.now()}`,
            channel: 'ESCROW_SYSTEM'
          }
        })
      ]);

      // 🛡️ Log the successful release
      await prisma.immutableLog.create({
        data: {
          entity_type: 'Order',
          entity_id: orderId,
          action: 'ESCROW_RELEASED',
          new_state: 'funds_transferred',
          signature: this.generateSignature({ orderId, amount, timestamp: new Date() })
        }
      });

      return true;
    } catch (error) {
      console.error('releaseEscrow Error:', error);
      return false;
    }
  }
}
