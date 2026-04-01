import prisma from '../prisma';

export class AlternativeSupplierEngine {
  /**
   * Phase 2: Alternative Supplier Finder
   * Suggests alternatives when a primary supplier is out of stock or delayed
   */
  static async findAlternatives(productId: number, excludedSupplierId: number) {
    const originalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true }
    });

    if (!originalProduct) throw new Error('Product not found');

    // 1. Find similar products (by name/sku prefix) from other suppliers
    const alternatives = await prisma.product.findMany({
      where: {
        name: { contains: originalProduct.name.split(' ')[0] }, // Match brand/type
        supplier_id: { not: excludedSupplierId },
        status: 'active'
      },
      include: { 
        supplier: true,
        inventory: { select: { quantity: true } }
      },
      take: 5
    });

    // 2. Rank by Price and Stock
    const ranked = alternatives.map(p => {
      const totalStock = p.inventory.reduce((sum, i) => sum + i.quantity, 0);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        supplierName: p.supplier.company_name,
        stock: totalStock,
        priceMatch: Number(p.price) <= Number(originalProduct.price) ? 'BETTER/EQUAL' : 'HIGHER',
        score: totalStock > 0 ? (100 - Number(p.price)) : 0 // Simple scoring
      };
    }).sort((a, b) => b.score - a.score);

    return {
      originalProduct: originalProduct.name,
      originalPrice: originalProduct.price,
      suggestions: ranked,
      insight: `تم العثور على ${ranked.length} موردين بدلاء بأسعار تنافسية ومخزون متاح.`
    };
  }
}
