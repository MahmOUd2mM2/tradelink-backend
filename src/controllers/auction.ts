import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const createAuction = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, product_name, quantity, target_price, expiry_at } = req.body;
    const buyer_id = req.user?.userId;

    if (!buyer_id) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const auction = await prisma.auction.create({
      data: {
        buyer_id,
        title,
        description,
        product_name,
        quantity,
        target_price,
        expiry_at: new Date(expiry_at),
        status: 'open'
      }
    });

    res.status(201).json({ message: 'Auction created', auction });
  } catch (err) {
    console.error('createAuction Error:', err);
    res.status(500).json({ message: 'Error creating auction' });
  }
};

export const placeBid = async (req: AuthRequest, res: Response) => {
  try {
    const { auction_id, price, delivery_days, notes } = req.body;
    const supplier_id = req.user?.userId;

    if (!supplier_id) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const auction = await prisma.auction.findUnique({ where: { id: auction_id } });
    if (!auction || auction.status !== 'open') {
      res.status(400).json({ message: 'Auction not found or closed' });
      return;
    }

    const bid = await prisma.bid.create({
      data: {
        auction_id,
        supplier_id,
        price,
        delivery_days,
        notes,
        status: 'pending'
      }
    });

    res.status(201).json({ message: 'Bid placed', bid });
  } catch (err) {
    console.error('placeBid Error:', err);
    res.status(500).json({ message: 'Error placing bid' });
  }
};

export const getAuctions = async (req: AuthRequest, res: Response) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: { status: 'open' },
      include: { buyer: { select: { company_name: true } }, _count: { select: { bids: true } } }
    });
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching auctions' });
  }
};

export const awardAuction = async (req: AuthRequest, res: Response) => {
  try {
    const { auction_id, bid_id } = req.body;
    const buyer_id = req.user?.userId;

    if (!buyer_id) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const auction = await prisma.auction.findUnique({
      where: { id: Number(auction_id) },
    });

    if (!auction || auction.buyer_id !== buyer_id) {
      res.status(403).json({ message: 'Forbidden or auction not found' });
      return;
    }

    // Atomic transaction for awarding
    await prisma.$transaction([
      // 1. Close Auction
      prisma.auction.update({
        where: { id: Number(auction_id) },
        data: { status: 'closed' }
      }),
      // 2. Accept Winning Bid
      prisma.bid.update({
        where: { id: Number(bid_id) },
        data: { status: 'accepted' }
      }),
      // 3. Reject others
      prisma.bid.updateMany({
        where: { auction_id: Number(auction_id), id: { not: Number(bid_id) } },
        data: { status: 'rejected' }
      })
    ]);

    res.json({ message: 'Auction awarded successfully' });
  } catch (err) {
    console.error('awardAuction Error:', err);
    res.status(500).json({ message: 'Error awarding auction' });
  }
};
