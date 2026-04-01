import prisma from '../prisma';

export interface WarehouseListing {
  id: number;
  ownerName: string;
  location: string;
  totalSpace: number; // in palettes or m2
  availableSpace: number;
  pricePerDay: number;
  features: string[]; // ['Cold Storage', 'Forklift', '24/7 Access']
  status: 'available' | 'full' | 'closed';
}

export class WarehouseRentalService {
  /**
   * Phase 12: Airbnb for Warehouses
   * Lists available warehouse spaces for sharing
   */
  static async getAvailableSpaces(): Promise<WarehouseListing[]> {
    const warehouses = await prisma.warehouse.findMany({
      include: { owner: true }
    });

    // Simulated data enrichment for the "Airbnb" experience
    return warehouses.map((w, index) => ({
      id: w.id,
      ownerName: w.owner.company_name || w.owner.name,
      location: `${w.city}, ${w.address}`,
      totalSpace: 500 + index * 100,
      availableSpace: Math.max(0, 100 - (index % 5) * 20),
      pricePerDay: 50 + (index % 3) * 25,
      features: index % 2 === 0 ? ['مخزن مبرد', 'تفريغ آلي'] : ['تأمين 24 ساعة', 'قريب من الميناء'],
      status: index % 4 === 0 ? 'full' : 'available'
    }));
  }

  /**
   * Creates a rental request (Phase 12)
   */
  static async requestStorage(buyerId: number, warehouseId: number, spaceRequired: number, days: number) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('Warehouse not found');

    const totalCost = spaceRequired * 10 * days; // Simulated pricing logic

    // Create a specialized transaction/order for storage
    const storageEscrow = await prisma.order.create({
      data: {
        buyer_id: buyerId,
        seller_id: warehouse.owner_id,
        total_amount: totalCost,
        status: 'pending',
        type: 'STORAGE_RENTAL'
      }
    });

    return {
      requestId: storageEscrow.id,
      totalCost,
      message: 'تم إرسال طلب تأجير المساحة للمالك. سيتم خصم المبلغ من المحفظة كضمان.'
    };
  }
}
