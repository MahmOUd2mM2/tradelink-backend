"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseRentalService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class WarehouseRentalService {
    /**
     * Phase 12: Airbnb for Warehouses
     * Lists available warehouse spaces for sharing
     */
    static getAvailableSpaces() {
        return __awaiter(this, void 0, void 0, function* () {
            const warehouses = yield prisma_1.default.warehouse.findMany({
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
        });
    }
    /**
     * Creates a rental request (Phase 12)
     */
    static requestStorage(buyerId, warehouseId, spaceRequired, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const warehouse = yield prisma_1.default.warehouse.findUnique({ where: { id: warehouseId } });
            if (!warehouse)
                throw new Error('Warehouse not found');
            const totalCost = spaceRequired * 10 * days; // Simulated pricing logic
            // Create a specialized transaction/order for storage
            const storageEscrow = yield prisma_1.default.order.create({
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
        });
    }
}
exports.WarehouseRentalService = WarehouseRentalService;
