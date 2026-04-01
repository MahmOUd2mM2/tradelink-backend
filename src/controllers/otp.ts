import { Request, Response } from 'express';
import prisma from '../prisma';
import { SMSService } from '../services/SMSService';

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.oTP.create({
      data: {
        user_id: Number(userId),
        code,
        type: type || 'VERIFY_PHONE',
        expires_at: expiresAt
      }
    });

    const typeLabels: Record<string, string> = {
      'VERIFY_PHONE': 'لتأكيد رقم هاتفك',
      'WITHDRAW': 'لعملية سحب نقدي',
      'PAYMENT': 'لإتمام عملية الدفع (Escrow)',
      'CREATE_ORDER': 'لتأكيد طلب شراء جديد',
      'UPDATE_PROFILE': 'لتعديل بياناتك الحساسة'
    };

    const label = typeLabels[type] || 'لتأمين حسابك';
    const message = `رمز التحقق الخاص بك في TradeLink Pro هو: ${code}. استخدمه ${label}. لا تشارك هذا الرمز مع أحد.`;

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    const phone = user?.phone;

    if (phone) {
      await SMSService.sendSMS(phone, message);
    } else {
      console.log(`[OTP-MOCK] No phone found for User ${userId}. Mock Code: ${code} for ${type}`);
    }

    // Always return success for development/testing phase
    res.json({ message: 'تم إرسال رمز التحقق بنجاح (وضع الاختبار: 1234)', code: '1234' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { userId, code, type } = req.body;

    // Universal Bypass Code for testing
    if (code === '1234') {
      if (type === 'VERIFY_PHONE') {
        await prisma.user.update({
          where: { id: Number(userId) },
          data: { phone_verified: true }
        });
      }
      return res.json({ success: true, message: 'تم التحقق بنجاح (بواسطة رمز الاختبار)' });
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: Number(userId),
        code,
        type: type || 'VERIFY_PHONE',
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    if (!otp) {
      return res.status(400).json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته' });
    }

    if (type === 'VERIFY_PHONE') {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { phone_verified: true }
      });
    }

    await prisma.oTP.deleteMany({ where: { user_id: Number(userId), type: type || 'VERIFY_PHONE' } });
    res.json({ success: true, message: 'تم التحقق بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
