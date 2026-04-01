import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const invoices = await prisma.invoice.findMany({
      where: role === 'Admin' ? {} : {
        order: {
          OR: [{ buyer_id: userId }, { seller_id: userId }]
        }
      },
      include: {
        order: {
          select: { id: true, status: true, total_amount: true, buyer: { select: { name: true, company_name: true } }, seller: { select: { name: true, company_name: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('getInvoices Error:', error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            buyer: { select: { name: true, company_name: true, email: true } },
            seller: { select: { name: true, company_name: true, email: true } }
          }
        }
      }
    });
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
    res.status(200).json(invoice);
  } catch (error) {
    console.error('getInvoiceById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    if (!status) { res.status(400).json({ message: 'Status is required' }); return; }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });
    res.status(200).json({ message: 'Invoice status updated', invoice });
  } catch (error) {
    console.error('updateInvoiceStatus Error:', error);
    res.status(500).json({ message: 'Server error updating invoice status' });
  }
};
