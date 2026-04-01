import prisma from '../prisma';

export class RetailerService {
  /**
   * Phase 6: B2B2C / POS Integration
   * Simulates a sale at a physical store (Retailer)
   * Decrements retailer inventory and logs the B2C transaction
   */
  static async recordPOSSale(retailerId: number, warehouseId: number, items: Array<{ productId: number, quantity: number }>) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const item of items) {
        // 1. Check & Decrement Inventory
        const inventory = await tx.inventory.findFirst({
          where: { product_id: item.productId, warehouse_id: warehouseId }
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId} at Retailer Warehouse ${warehouseId}`);
        }

        const updatedInv = await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } }
        });

        results.push({ productId: item.productId, newQuantity: updatedInv.quantity });
      }

      // 2. Log B2C Event for Analytics (Heat Maps/Predictive)
      await tx.immutableLog.create({
        data: {
          entity_type: 'Retailer_POS',
          entity_id: retailerId,
          action: 'SALE_RECORDED',
          new_state: JSON.stringify(items),
          signature: `B2C-POS-${Date.now()}`
        }
      });

      return results;
    });
  }

  /**
   * Generates a Digital ID / Reputation Score (Phase 41)
   */
  static async getMerchantReputation(merchantId: number) {
    const orders = await prisma.order.findMany({ where: { seller_id: merchantId } });
    const successful = orders.filter(o => o.status === 'delivered').length;
    const total = orders.length;

    const score = total > 0 ? (successful / total) * 100 : 95; // Default 95 for newcomers
    
    return {
      merchantId,
      reputationScore: score.toFixed(1),
      badge: score > 90 ? 'TradeLink Verified' : 'Standard',
      level: score > 95 ? 'Elite Provider' : 'Trusted'
    };
  }
}
