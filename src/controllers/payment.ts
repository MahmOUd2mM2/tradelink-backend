import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { order_id, method, amount } = req.body;
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
    if (!order_id || !method || !amount) {
      res.status(400).json({ message: 'Missing required fields (order_id, method, amount)' }); return;
    }
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

    const txRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payment = await prisma.payment.create({
      data: { order_id, method, amount, status: 'pending', transaction_ref: txRef }
    });
    res.status(201).json({ message: 'Payment created', payment });
  } catch (error) {
    console.error('createPayment Error:', error);
    res.status(500).json({ message: 'Server error creating payment' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const payments = await prisma.payment.findMany({
      where: role === 'Admin' ? {} : {
        order: {
          OR: [{ buyer_id: userId }, { seller_id: userId }]
        }
      },
      include: {
        order: {
          select: { id: true, status: true, buyer: { select: { name: true } }, seller: { select: { name: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error('getPayments Error:', error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: { include: { buyer: { select: { name: true } }, seller: { select: { name: true } } } } }
    });
    if (!payment) { res.status(404).json({ message: 'Payment not found' }); return; }
    res.status(200).json(payment);
  } catch (error) {
    console.error('getPaymentById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!status) { res.status(400).json({ message: 'Status is required' }); return; }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status }
    });

    // If payment is completed, update order status to paid
    if (status === 'completed') {
      await prisma.order.update({ where: { id: payment.order_id }, data: { status: 'paid' } });
    }

    res.status(200).json({ message: 'Payment status updated', payment });
  } catch (error) {
    console.error('updatePaymentStatus Error:', error);
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};
