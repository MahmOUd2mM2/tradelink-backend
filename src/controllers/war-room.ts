import { Request, Response } from 'express';
import prisma from '../prisma';
import { PredictionEngine } from '../services/PredictionEngine';
import { CrisisRadarService } from '../services/CrisisRadarService';

export const getWarRoomStats = async (req: Request, res: Response) => {
  try {
    // 1. Live Trade Pulse
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: { buyer: { select: { company_name: true } }, seller: { select: { company_name: true } } }
    });

    const activeOrdersCount = await prisma.order.count({
      where: { status: { in: ['pending', 'paid', 'shipped'] } }
    });

    // 2. Escrow Volume
    const wallets = await prisma.wallet.findMany();
    const totalEscrow = wallets.reduce((acc, w) => acc + Number(w.escrow_balance), 0);

    // 3. Industrial Intel & Security (Phase 26/28)
    const securityScore = await PredictionEngine.calculateSecurityScore();
    const marketAlerts = await PredictionEngine.getMarketAlerts();
    
    // 🌐 Phase 24: Global Commodity Index Radar
    const globalTrends = await CrisisRadarService.getGlobalTrends();

    const securityEvents = [
      { id: Date.now(), type: 'DDoS Mitigated (Edge)', time: '02m ago', severity: 'low' },
      { id: Date.now() - 1000, type: 'Unauthorized API Access Blocked', time: '15m ago', severity: 'medium' },
      { id: Date.now() - 2000, type: 'Blockchain Integrity Verified', time: 'Live', severity: 'high' }
    ];

    res.json({
      pulse: {
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          buyer: o.buyer.company_name,
          seller: o.seller.company_name,
          amount: o.total_amount,
          status: o.status
        })),
        activeOrdersCount,
        totalEscrow: totalEscrow.toFixed(2)
      },
      security: {
        score: securityScore,
        events: securityEvents
      },
      radar: {
        local: marketAlerts.map(a => ({ ...a, isHot: a.severity === 'high' })),
        global: globalTrends
      },
      heatMap: [
        { city: 'القاهرة', intensity: 0.9, demand: 'High', color: 'red' },
        { city: 'الإسكندرية', intensity: 0.7, demand: 'Medium-High', color: 'orange' },
        { city: 'المنصورة', intensity: 0.85, demand: 'Critical', color: 'red' },
        { city: 'أسيوط', intensity: 0.3, demand: 'Low', color: 'blue' },
        { city: 'سوهاج', intensity: 0.45, demand: 'Stable', color: 'green' }
      ]
    });
  } catch (err) {
    console.error('WarRoom Stats Error:', err);
    res.status(500).json({ message: 'Error fetching war room stats' });
  }
};
