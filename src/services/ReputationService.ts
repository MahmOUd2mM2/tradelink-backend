import prisma from '../prisma';

export class ReputationService {
  /**
   * Phase 5: Trade Score Calculation
   * Calculates a merchant's reputation score based on:
   * 1. Fulfillment Rate (Orders delivered/cancelled)
   * 2. Payment Punctuality
   * 3. Volume and Frequency
   * 4. Customer/Retailer Feedback
   */
  /**
   * Phase 5: Trade Score Calculation
   * Calculates a merchant's reputation score based on:
   * 1. Fulfillment Rate (Orders delivered/cancelled)
   * 2. Payment Punctuality (Real date diff)
   * 3. Volume and Frequency
   */
  static async calculateTradeScore(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller_orders: { include: { invoices: { include: { order: { include: { payments: true } } } } } },
        buyer_orders: { include: { payments: true } }
      }
    });

    if (!user) throw new Error('User not found');

    // 1. Fulfillment Analytics
    const sellerOrders = (user as any).seller_orders as any[];
    const totalOrders = sellerOrders.length;
    if (totalOrders === 0) return { score: 50, level: 'BRONZE', badge: 'تاجر جديد' };

    const completedOrders = sellerOrders.filter(o => o.status === 'delivered').length;
    const fulfillmentRate = (completedOrders / totalOrders) * 100;

    // 2. Industrial Payment Punctuality (Real Logic)
    let totalPunctualityScore = 0;
    let paymentCount = 0;

    sellerOrders.forEach(order => {
      order.invoices.forEach((invoice: any) => {
        const payment = invoice.order.payments[0]; // Assuming primary payment
        if (payment && payment.status === 'completed') {
          const invDate = new Date(invoice.created_at).getTime();
          const payDate = new Date(payment.created_at).getTime();
          const diffDays = (payDate - invDate) / (1000 * 60 * 60 * 24);
          
          // Industrial Benchmarking: 0-3 days = 100%, 4-7 days = 70%, >7 days = 30%
          if (diffDays <= 3) totalPunctualityScore += 100;
          else if (diffDays <= 7) totalPunctualityScore += 70;
          else totalPunctualityScore += 30;
          paymentCount++;
        }
      });
    });

    const paymentPunctuality = paymentCount > 0 ? (totalPunctualityScore / paymentCount) : 80;

    // 3. Trade Volume Score (Log-based normalization)
    const totalTradeVolume = sellerOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
    const volumeScore = Math.min(Math.log10(totalTradeVolume + 1) * 10, 100); 

    // Final Weighted Score: 40% Fulfillment, 40% Punctuality, 20% Volume
    const score = Math.round((fulfillmentRate * 0.4) + (paymentPunctuality * 0.4) + (volumeScore * 0.2));

    let level = 'BRONZE';
    let badge = 'تاجر ناشئ';
    let creditLimit = '5,000 EGP (Standard)';

    if (score > 85) { 
      level = 'PLATINUM'; 
      badge = 'تريدلينك موثوق (TradeLink Verified)'; 
      creditLimit = 'Up to 1,000,000 EGP';
    }
    else if (score > 70) { 
      level = 'GOLD'; 
      badge = 'تاجر مميز'; 
      creditLimit = 'Up to 250,000 EGP';
    }

    // 🔄 Log Score Change for Auditability
    await prisma.immutableLog.create({
      data: {
        entity_type: 'User_Reputation',
        entity_id: userId,
        action: 'SCORE_CALCULATED',
        new_state: JSON.stringify({ score, level, volume: totalTradeVolume }),
        signature: `REP-SCORE-${Date.now()}`
      }
    });

    return {
      userId,
      company: user.company_name,
      score,
      level,
      badge,
      metrics: {
        fulfillmentRate: `${fulfillmentRate.toFixed(1)}%`,
        paymentPunctuality: `${paymentPunctuality.toFixed(1)}%`,
        tradeVolume: `${totalTradeVolume.toLocaleString()} EGP`,
        creditLimit
      },
      insight: score > 75 
        ? `🚀 سمِعتك التجارية ممتازة! أنت الآن مؤهل للحصول على تمويل مشتريات (Credit) بحد أقصى ${creditLimit}.`
        : `💡 نصيحة: التزم بمواعيد التسليم والدفع لرفع تقييمك والحصول على تسهيلات ائتمانية أفضل.`
    };
  }
}
