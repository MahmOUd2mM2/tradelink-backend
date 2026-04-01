import prisma from '../prisma';

export interface MarketTrend {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  alert: string | null;
  severity: 'low' | 'medium' | 'high';
}

export class CrisisRadarService {
  /**
   * Simulates tracking global commodity indices and Egyptian market gaps
   */
  static async getGlobalTrends(): Promise<MarketTrend[]> {
    // 🌍 Simulated Global Indices (Phase 24: Global Commodity Index)
    const baseTrends = [
      { symbol: 'SUGAR-LME', name: 'السكر الأبيض (لندن)', currentPrice: 620, change24h: 5.2 },
      { symbol: 'WHEAT-CBOT', name: 'القمح (شيكاغو)', currentPrice: 215, change24h: -1.5 },
      { symbol: 'OIL-BRENT', name: 'زيت النخيل الخام', currentPrice: 950, change24h: 3.8 }
    ];

    return baseTrends.map(t => {
      let alert = null;
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (t.change24h > 4) {
        alert = `🚨 رادار الأزمات: ارتفاع حاد في ${t.name} عالمياً بنسبة ${t.change24h}%. متوقع تأثر السوق المحلي خلال 7 أيام.`;
        severity = 'high';
      } else if (t.change24h > 2) {
        alert = `⚠️ تنبيه: زيادة طفيفة في أسعار ${t.name}. راقب مخزونك.`;
        severity = 'medium';
      }

      return {
        ...t,
        alert,
        severity
      };
    });
  }

  /**
   * Suggests alternative suppliers for a given product (Phase 6: Supplier Alternatives)
   */
  static async getAlternativeSuppliers(productId: number, excludeSupplierId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return [];

    // Find other suppliers with same name/category or SKU pattern
    const alternatives = await prisma.product.findMany({
      where: {
        name: { contains: product.name.split(' ')[0] }, // Match first word
        id: { not: productId },
        supplier_id: { not: excludeSupplierId },
        status: 'active'
      },
      include: {
        supplier: {
          select: { company_name: true, city: true, verified: true }
        }
      },
      take: 3
    });

    return alternatives.map(a => ({
      id: a.id,
      name: a.name,
      supplier: a.supplier.company_name,
      location: a.supplier.city,
      price: a.price,
      isVerified: a.supplier.verified
    }));
  }

  /**
   * Phase 4: Stock Optimizer - Suggests inventory increases for rising commodities
   */
  static async suggestStockOptimization(userId: number) {
    const trends = await this.getGlobalTrends();
    const highRiskTrends = trends.filter(t => t.severity === 'high');
    
    if (highRiskTrends.length === 0) return [];

    const suggestions = [];

    for (const trend of highRiskTrends) {
      // Find user products matching the keyword (e.g., "سكر", "زيت")
      const keyword = trend.name.includes('سكر') ? 'سكر' : 
                      trend.name.includes('زيت') ? 'زيت' : 
                      trend.name.includes('قمح') ? 'دقيق' : null;

      if (!keyword) continue;

      const inventory = await prisma.inventory.findMany({
        where: {
          warehouse: { owner_id: userId },
          product: { name: { contains: keyword } }
        },
        include: { product: true, warehouse: true }
      });

      for (const item of inventory) {
        if (item.quantity < 500) { // Arbitrary threshold
          suggestions.push({
            product: item.product.name,
            currentStock: item.quantity,
            trend: trend.name,
            priceChange: trend.change24h,
            recommendation: `قم بتأمين ${500 - item.quantity} وحدة إضافية لتجنب الزيادة المتوقعة بنسبة ${trend.change24h}%`,
            urgency: trend.severity
          });
        }
      }
    }

    return suggestions;
  }
}
