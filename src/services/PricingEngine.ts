import prisma from '../prisma';

export interface PricingResult {
  unitPrice: number;
  totalAmount: number;
  appliedDiscounts: string[];
}

export class PricingEngine {
  static async calculatePrice(productId: number, quantity: number, buyerId: number): Promise<PricingResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        inventory: { 
          include: { warehouse: { include: { owner: true } } } 
        } 
      }
    });

    if (!product) throw new Error('Product not found');

    const supplierId = product.inventory[0]?.warehouse.owner.id;
    let unitPrice = Number(product.price);
    const appliedDiscounts: string[] = [];

    // 1. Tiered Pricing (Maksab/Cartona style)
    if (product.min_bulk_qty && quantity >= product.min_bulk_qty && product.bulk_price) {
      unitPrice = Number(product.bulk_price);
      appliedDiscounts.push(`خصم الكمية (Bulk): ${unitPrice} ج.م`);
    }

    // 2. Rule-Based Dynamic Pricing (Enterprise style)
    if (supplierId) {
      const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
      const rules = await (prisma as any).discountRule.findMany({
        where: { supplier_id: supplierId, is_active: true }
      });

      for (const rule of rules) {
        let ruleApplied = true;

        if (rule.min_qty && quantity < rule.min_qty) ruleApplied = false;
        if (rule.min_score && (buyer as any)?.score < rule.min_score) ruleApplied = false;

        if (ruleApplied) {
          const discountAmount = unitPrice * (rule.discount_pct / 100);
          unitPrice -= discountAmount;
          appliedDiscounts.push(`قاعدة خصم المورد: -${rule.discount_pct}%`);
        }
      }
    }

    return {
      unitPrice,
      totalAmount: unitPrice * quantity,
      appliedDiscounts
    };
  }
}
