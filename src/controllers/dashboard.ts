import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    // Total counts
    const [totalUsers, totalProducts, totalOrders, totalPayments] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.payment.count()
    ]);

    // Revenue (completed payments)
    const revenue = await prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });

    // Orders by status
    const [pendingOrders, paidOrders, shippedOrders, deliveredOrders] = await Promise.all([
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
    ]);

    // Unpaid invoices
    const unpaidInvoices = await prisma.invoice.aggregate({
      where: { status: 'unpaid' },
      _sum: { amount: true },
      _count: true
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        buyer: { select: { name: true, company_name: true } },
        seller: { select: { name: true, company_name: true } }
      }
    });

    // Calculate total inventory value
    const inventories = await prisma.inventory.findMany({
      include: { product: true }
    });
    const inventoryValue = inventories.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.product.price));
    }, 0);

    // Approximate VAT (14% of revenue) for demo if not explicitly stored
    const pendingTaxes = (Number(revenue._sum.amount) || 0) * 0.14;

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalPayments,
      revenue: Number(revenue._sum.amount) || 0,
      inventoryValue,
      pendingTaxes,
      ordersByStatus: { pending: pendingOrders, paid: paidOrders, shipped: shippedOrders, delivered: deliveredOrders },
      unpaidInvoices: { count: unpaidInvoices._count, total: Number(unpaidInvoices._sum.amount) || 0 },
      recentOrders,
      currency: 'EGP'
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};
