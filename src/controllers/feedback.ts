import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, subject, message } = req.body;
    const userId = req.user?.userId;

    if (!type || !subject || !message) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const feedback = await (prisma as any).feedback.create({
      data: {
        user_id: Number(userId),
        type,
        subject,
        message,
        status: 'open'
      }
    });

    res.status(201).json({ message: 'شكراً لمشاركتنا رأيك! تم تسجيل طلبك بنجاح.', feedback });
  } catch (error) {
    console.error('submitFeedback Error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الملاحظات' });
  }
};

export const getAdminFeedbacks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Basic admin check (could be more robust with a middleware)
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!(user as any)?.is_admin) {
      res.status(403).json({ message: 'غير مصرح لك بالدخول لهذه الصفحة' });
      return;
    }

    const feedbacks = await (prisma as any).feedback.findMany({
      include: { user: { select: { name: true, company_name: true, phone: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks' });
  }
};

export const resolveFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!(user as any)?.is_admin) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await (prisma as any).feedback.update({
      where: { id: Number(id) },
      data: { status: 'resolved' }
    });

    res.status(200).json({ message: 'تم تحديث حالة الطلب كمنتهي' });
  } catch (error) {
     res.status(500).json({ message: 'Error' });
  }
};
