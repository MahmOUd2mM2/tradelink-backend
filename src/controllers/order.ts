import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

import { PricingEngine } from '../services/PricingEngine';
import { PluginMetaService } from '../services/PluginMetaService';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, seller_id, release_lat, release_lng, otpCode } = req.body;
    const buyerId = req.user?.userId;

    if (!buyerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // 🛡️ Security: Enforce OTP for Order Creation (High-Trust Trade)
    if (!otpCode) {
       res.status(400).json({ message: 'مطلوب رمز التحقق (OTP) لتأكيد الطلب' });
       return;
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        user_id: Number(buyerId),
        code: otpCode,
        type: 'CREATE_ORDER',
        expires_at: { gt: new Date() }
      }
    });

    if (!otp) {
       res.status(400).json({ message: 'رمز التحقق الخاص بإنشاء الطلب غير صحيح أو منتهي' });
       return;
    }

    if (!items || !items.length || !seller_id) {
      res.status(400).json({ message: 'Missing order details' });
      return;
    }

    // Mark OTP as consumed
    await prisma.oTP.deleteMany({ where: { user_id: Number(buyerId), type: 'CREATE_ORDER' } });

    // Advanced Pricing Calculation
    let total_amount = 0;
    const itemsWithPrices = [];
    const appliedDiscounts = [];

    for (const item of items) {
       const pricing = await PricingEngine.calculatePrice(item.product_id, item.quantity, buyerId);
       total_amount += pricing.totalAmount;
       itemsWithPrices.push({
          ...item,
          unit_price: pricing.unitPrice
       });
       appliedDiscounts.push(...pricing.appliedDiscounts);
    }

    // Generate Programmatic Escrow Release Code (6-digit OTP)
    const release_code = Math.floor(100000 + Math.random() * 900000).toString();

    const order = await prisma.order.create({
      data: {
        buyer_id: buyerId,
        seller_id,
        total_amount,
        status: 'pending',
        release_code,
        release_lat: Number(release_lat) || null,
        release_lng: Number(release_lng) || null,
        items: {
          create: itemsWithPrices.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        },
        invoices: {
          create: {
            invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: total_amount,
            status: 'unpaid'
          }
        }
      },
      include: {
        items: true,
        invoices: true
      }
    });

    res.status(201).json({ 
      message: 'Order placed and invoice generated', 
      order,
      appliedDiscounts
    });

    // 🚀 Phase 4: Open API Webhook Trigger
    PluginMetaService.triggerWebhook('ORDER_CREATED', order).catch(err => console.error('Webhook Error:', err));
  } catch (error) {
    console.error('createOrder Error:', error);
    res.status(500).json({ message: 'Server error processing order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // If Wholesale/Supplier, they are selling. If Retailer, they are buying.
    const orders = await prisma.order.findMany({
      where:
        role === 'Supplier' || role === 'Wholesaler'
          ? { seller_id: userId }
          : { buyer_id: userId },
      include: {
        items: {
          include: { product: true }
        },
        buyer: { select: { name: true, company_name: true } },
        seller: { select: { name: true, company_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('getOrders Error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        buyer: { select: { name: true, company_name: true, email: true } },
        seller: { select: { name: true, company_name: true, email: true } },
        invoices: true,
        payments: true,
        shipments: true
      }
    });
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    res.status(200).json(order);
  } catch (error) {
    console.error('getOrderById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!status) { res.status(400).json({ message: 'Status is required' }); return; }

    const previousOrder = await prisma.order.findUnique({ where: { id }, include: { invoices: true } });
    if (!previousOrder) { res.status(404).json({ message: 'Order not found' }); return; }

    const order = await prisma.order.update({ where: { id }, data: { status } });

    // Escrow Release Logic
    if (status === 'delivered' && previousOrder.status !== 'delivered') {
      const paidInvoices = previousOrder.invoices.filter(inv => inv.status === 'paid');
      const totalToRelease = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

      if (totalToRelease > 0) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { user_id: previousOrder.seller_id },
            data: {
              escrow_balance: { decrement: totalToRelease },
              balance: { increment: totalToRelease },
              transactions: {
                create: {
                  type: 'DEPOSIT', // Using DEPOSIT as it represents income to main balance
                  amount: totalToRelease,
                  status: 'completed',
                  reference: `REL-${id}`,
                  description: `Escrow release for Order #${id} (Delivered)`
                }
              }
            }
          })
        ]);
      }
    }

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    if (order.status === 'delivered') {
      res.status(400).json({ message: 'Cannot cancel a delivered order' }); return;
    }
    const updated = await prisma.order.update({ where: { id }, data: { status: 'cancelled' } });
    res.status(200).json({ message: 'Order cancelled', order: updated });
  } catch (error) {
    console.error('cancelOrder Error:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};
