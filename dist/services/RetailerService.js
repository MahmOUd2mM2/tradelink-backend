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
exports.RetailerService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class RetailerService {
    /**
     * Phase 6: B2B2C / POS Integration
     * Simulates a sale at a physical store (Retailer)
     * Decrements retailer inventory and logs the B2C transaction
     */
    static recordPOSSale(retailerId, warehouseId, items) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const results = [];
                for (const item of items) {
                    // 1. Check & Decrement Inventory
                    const inventory = yield tx.inventory.findFirst({
                        where: { product_id: item.productId, warehouse_id: warehouseId }
                    });
                    if (!inventory || inventory.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for product ${item.productId} at Retailer Warehouse ${warehouseId}`);
                    }
                    const updatedInv = yield tx.inventory.update({
                        where: { id: inventory.id },
                        data: { quantity: { decrement: item.quantity } }
                    });
                    results.push({ productId: item.productId, newQuantity: updatedInv.quantity });
                }
                // 2. Log B2C Event for Analytics (Heat Maps/Predictive)
                yield tx.immutableLog.create({
                    data: {
                        entity_type: 'Retailer_POS',
                        entity_id: retailerId,
                        action: 'SALE_RECORDED',
                        new_state: JSON.stringify(items),
                        signature: `B2C-POS-${Date.now()}`
                    }
                });
                return results;
            }));
        });
    }
    /**
     * Generates a Digital ID / Reputation Score (Phase 41)
     */
    static getMerchantReputation(merchantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield prisma_1.default.order.findMany({ where: { seller_id: merchantId } });
            const successful = orders.filter(o => o.status === 'delivered').length;
            const total = orders.length;
            const score = total > 0 ? (successful / total) * 100 : 95; // Default 95 for newcomers
            return {
                merchantId,
                reputationScore: score.toFixed(1),
                badge: score > 90 ? 'TradeLink Verified' : 'Standard',
                level: score > 95 ? 'Elite Provider' : 'Trusted'
            };
        });
    }
}
exports.RetailerService = RetailerService;
