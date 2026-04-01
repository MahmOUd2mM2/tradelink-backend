import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { created_at: 'desc' }
    });
    const sanitized = users.map(({ password, ...u }) => u);
    res.status(200).json(sanitized);
  } catch (error) {
    console.error('getUsers Error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        products: true,
        warehouses: true,
        buyer_orders: { take: 5, orderBy: { created_at: 'desc' } },
        seller_orders: { take: 5, orderBy: { created_at: 'desc' } }
      }
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const { password, ...sanitized } = user;
    res.status(200).json(sanitized);
  } catch (error) {
    console.error('getUserById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || Number(req.query.userId);
    if (!userId) { res.status(401).json({ message: 'Unauthorized or missing userId' }); return; }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    const { password, ...sanitized } = user;
    res.status(200).json(sanitized);
  } catch (error) {
    console.error('getProfile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!status) { res.status(400).json({ message: 'Status is required' }); return; }

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });
    const { password, ...sanitized } = user;
    res.status(200).json({ message: 'User status updated', user: sanitized });
  } catch (error) {
    console.error('updateUserStatus Error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
};

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.user.findMany({
      where: {
        role: { name: 'Supplier' },
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        company_name: true,
        email: true,
        status: true,
        verified: true
      }
    });

    // Enhance with UI-specific fields (normally these would be in DB)
    const enhanced = suppliers.map(s => ({
      ...s,
      country: ['الإمارات', 'تركيا', 'الهند', 'البرازيل', 'الصين'][s.id % 5],
      rating: (4.5 + (s.id % 5) * 0.1).toFixed(1),
      category: s.id % 2 === 0 ? 'خامات غذائية' : 'منتجات معبأة'
    }));

    res.status(200).json(enhanced);
  } catch (error) {
    console.error('getSuppliers Error:', error);
    res.status(500).json({ message: 'Error fetching suppliers' });
  }
};
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, company_name, phone, otpCode } = req.body;

    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    // 🛡️ Security: Mandatory OTP for Profile Update
    if (!otpCode) {
      res.status(400).json({ message: 'مطلوب رمز التحقق (OTP) لتحديث البيانات' });
      return;
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: userId,
        code: otpCode,
        type: 'UPDATE_PROFILE',
        expires_at: { gt: new Date() }
      }
    });

    if (!otp) {
      res.status(400).json({ message: 'رمز التحقق غير صحيح أو انتهى' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, company_name, phone }
    });

    // Mark as consumed
    await prisma.oTP.deleteMany({ where: { user_id: userId, type: 'UPDATE_PROFILE' } });

    const { password, ...sanitized } = updatedUser;
    res.status(200).json({ message: 'تم تحديث الملف الشخصي بنجاح', user: sanitized });
  } catch (error) {
    console.error('updateProfile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
