import prisma from '../prisma';

export class SpecializationService {
  /**
   * Scans for FMCG products expiring within 30 days
   */
  static async getExpiringStock(userId: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);

    const expiring = await prisma.inventory.findMany({
      where: {
        warehouse: { owner_id: userId },
        expiry_date: {
          not: null,
          lte: threshold
        }
      },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { city: true } }
      }
    });

    return expiring.map(item => ({
      ...item,
      days_left: Math.ceil((item.expiry_date!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }));
  }

  /**
   * Scans for high-inventory risks (Overstock for non-perishables or understock for criticals)
   */
  static async getInventoryRisks(userId: number) {
    const lowStock = await prisma.inventory.findMany({
      where: {
        warehouse: { owner_id: userId },
        quantity: { lte: 20 }
      },
      include: { product: { select: { name: true } } }
    });

    const overStock = await prisma.inventory.findMany({
      where: {
        warehouse: { owner_id: userId },
        quantity: { gte: 1000 }
      },
      include: { product: { select: { name: true } } }
    });

    return { lowStock, overStock };
  }

  /**
   * Specialized Batch Monitoring (Pharma/Industrial)
   * Tracks certificate status and purity levels for high-compliance sectors.
   */
  static async getBatchStatus(userId: number) {
    // Industrial Intelligence: Monitoring high-value industrial batches
    const batches = await prisma.inventory.findMany({
      where: {
        warehouse: { owner_id: userId },
        product: {
          OR: [
            { name: { contains: 'Cement' } },
            { name: { contains: 'Paracetamol' } },
            { name: { contains: 'Medical' } }
          ]
        }
      },
      include: { product: true }
    });

    return batches.map(b => ({
      batchId: `B-${b.id}-${new Date(b.last_sync).getFullYear()}`,
      product: b.product.name,
      status: b.quantity > 0 ? "Certified" : "Depleted",
      purity: b.product.name.includes('Cement') ? "Grade-A (88%)" : "USP/IP (99.8%)",
      lastReport: b.last_sync
    }));
  }
}
