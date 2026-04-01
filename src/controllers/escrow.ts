import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { FinancialService } from '../services/FinancialService';

export const verifyFulfillment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { releaseCode, lat, lng } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { buyer: true, seller: true }
    });

    if (!order) {
       res.status(404).json({ message: 'Order not found' });
       return;
    }

    // verification logic
    let verified = true;
    const failures = [];

    // 1. Check if the release code is a valid OTP for this order/user
    const otpVerification = await prisma.oTP.findFirst({
      where: {
        user_id: order.buyer_id,
        code: releaseCode,
        type: 'RELEASE_ESCROW',
        expires_at: { gt: new Date() }
      }
    });

    if (!otpVerification && (order as any).release_code !== releaseCode) {
      verified = false;
      failures.push('رمز التحقق/الاستلام غير صحيح أو انتهت صلاحيته');
    }

    if ((order as any).release_lat && (order as any).release_lng && lat && lng) {
      const distance = Math.sqrt(Math.pow((order as any).release_lat - lat, 2) + Math.pow((order as any).release_lng - lng, 2));
      const threshold = 0.005; // Approx 500m
      if (distance > threshold) {
        verified = false;
        failures.push('الموقع الجغرافي خارج نطاق المستودع المحدد');
      }
    }

    if (!verified) {
      res.status(400).json({ message: 'فشل توثيق الاستلام', reasons: failures });
      return;
    }

    // Success: Update Order & Trigger Instant Clearing
    await prisma.order.update({
      where: { id: Number(id) },
      data: { 
        release_status: 'verified',
        status: 'delivered' 
      }
    });

    // 💰 Phase 102: Instant Clearing (TradeLink Cash Integration)
    const clearingSuccess = await FinancialService.releaseEscrow(Number(id));

    res.status(200).json({ 
      message: clearingSuccess 
        ? 'تم التوثيق بنجاح! تم تحرير أموال الضمان للمورد فوراً.' 
        : 'تم التوثيق بنجاح! جاري معالجة تحويل الأموال تلقائياً.' 
    });
  } catch (err) {
    console.error('verifyFulfillment Error:', err);
    res.status(500).json({ message: 'Error verifying fulfillment' });
  }
};
