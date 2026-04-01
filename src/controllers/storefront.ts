import { Request, Response } from 'express';
import prisma from '../prisma';

export const getNearbyRetailers = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    // B2C: List retailers for consumer app
    const retailers = await prisma.user.findMany({
      where: { role: { name: 'Retailer' }, status: 'active' },
      select: { id: true, name: true, company_name: true, phone: true, latitude: true, longitude: true }
    });

    res.json(retailers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching storefronts' });
  }
};

export const placeB2COrder = async (req: Request, res: Response) => {
  try {
    const { consumerName, phone, retailerId, items } = req.body;
    // Phase 5: One-click consumer buy
    res.json({
      message: 'تم استلام طلبك! المندوب سيتواصل معك في أقرب وقت.',
      orderRef: `B2C-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Checkout error' });
  }
};
