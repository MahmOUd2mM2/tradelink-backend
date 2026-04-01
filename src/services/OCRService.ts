import prisma from '../prisma';

export interface OCRResult {
  product_sku: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export class OCRService {
  /**
   * Simulates Google Vision API deep parsing of an invoice image
   */
  static async simulateGoogleVision(imageUrl: string): Promise<OCRResult[]> {
    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock highly accurate parsed data with categories
    return [
      { product_sku: 'SUGAR-1KG-EGY', product_name: 'سكر عبور 1كج', category: 'FMCG', quantity: 50, unit_price: 27.5, total: 1375 },
      { product_sku: 'CEMENT-50KG-SNI', product_name: 'أسمنت سيناء 50كج', category: 'Construction', quantity: 100, unit_price: 110, total: 11000 },
      { product_sku: 'MED-PARA-500', product_name: 'باراسيتامول 500مج', category: 'Pharma', quantity: 200, unit_price: 15, total: 3000 }
    ];
  }

  /**
   * Maps OCR results to the database, updating inventory levels
   */
  static async syncToInventory(userId: number, warehouseId: number, items: OCRResult[]) {
    const results = [];

    for (const item of items) {
      // 1. Find or create product by SKU (simulation of auto-cataloging)
      let product = await prisma.product.findUnique({ where: { sku: item.product_sku } });
      
      if (!product) {
        // Auto-create product if it doesn't exist (industrial auto-onboarding)
        product = await prisma.product.create({
          data: {
            name: item.product_name,
            sku: item.product_sku,
            price: item.unit_price,
            supplier_id: userId, // Assuming current user is the supplier/owner
          }
        });
      }

      // 2. Increment Inventory
      const inventory = await (prisma.inventory as any).upsert({
        where: {
          product_id_warehouse_id: {
            product_id: product.id,
            warehouse_id: warehouseId
          }
        } as any,
        update: {
          quantity: { increment: item.quantity },
          last_sync: new Date()
        },
        create: {
          product_id: product.id,
          warehouse_id: warehouseId,
          quantity: item.quantity,
          last_sync: new Date()
        }
      });

      // 3. Log the change for audit trail
      await prisma.immutableLog.create({
        data: {
          entity_type: 'Inventory',
          entity_id: inventory.id,
          action: 'OCR_SYNC',
          new_state: JSON.stringify({ sku: item.product_sku, added: item.quantity })
        }
      });

      results.push({ sku: item.product_sku, status: 'Synced', newQuantity: inventory.quantity });
    }

    return results;
  }

  /**
   * Phase 5: OCR 2.0 Auto-Archive
   * The "Paper-to-Digital" bridge. Takes an image, extracts goods, and auto-onboards them.
   */
  static async autoArchive(userId: number, warehouseId: number, imageUrl: string) {
    // 1. Vision Engine Parsing
    const items = await this.simulateGoogleVision(imageUrl);

    // 2. Sync to Warehouse Stock
    const syncResults = await this.syncToInventory(userId, warehouseId, items);

    // 3. Final Result for the UI
    return {
      message: '📦 تم تحويل الفاتورة الورقية إلى مخزون رقمي بنجاح!',
      itemsProcessed: items.length,
      details: syncResults,
      timestamp: new Date().toISOString()
    };
  }
}
