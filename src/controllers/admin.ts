import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'Admin') { 
      res.status(403).json({ message: 'Forbidden' }); return; 
    }

    const [users, products, orders, feedback] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.feedback.count()
    ]);

    const recentLogs = await prisma.immutableLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      stats: { users, products, orders, feedback },
      logs: recentLogs
    });
  } catch (error) {
    console.error('getAdminStats Error:', error);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
};

export const resolveFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
     const id = parseInt(req.params.id as string);
     await (prisma as any).feedback.update({
       where: { id },
       data: { status: 'resolved' }
     });
     res.status(200).json({ message: 'Feedback resolved' });
   } catch (err) {
     res.status(500).json({ message: 'Error resolving feedback' });
   }
};
