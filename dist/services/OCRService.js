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
exports.OCRService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class OCRService {
    /**
     * Simulates Google Vision API deep parsing of an invoice image
     */
    static simulateGoogleVision(imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            // Mock processing delay
            yield new Promise(resolve => setTimeout(resolve, 1500));
            // Mock highly accurate parsed data with categories
            return [
                { product_sku: 'SUGAR-1KG-EGY', product_name: 'سكر عبور 1كج', category: 'FMCG', quantity: 50, unit_price: 27.5, total: 1375 },
                { product_sku: 'CEMENT-50KG-SNI', product_name: 'أسمنت سيناء 50كج', category: 'Construction', quantity: 100, unit_price: 110, total: 11000 },
                { product_sku: 'MED-PARA-500', product_name: 'باراسيتامول 500مج', category: 'Pharma', quantity: 200, unit_price: 15, total: 3000 }
            ];
        });
    }
    /**
     * Maps OCR results to the database, updating inventory levels
     */
    static syncToInventory(userId, warehouseId, items) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const item of items) {
                // 1. Find or create product by SKU (simulation of auto-cataloging)
                let product = yield prisma_1.default.product.findUnique({ where: { sku: item.product_sku } });
                if (!product) {
                    // Auto-create product if it doesn't exist (industrial auto-onboarding)
                    product = yield prisma_1.default.product.create({
                        data: {
                            name: item.product_name,
                            sku: item.product_sku,
                            price: item.unit_price,
                            supplier_id: userId, // Assuming current user is the supplier/owner
                        }
                    });
                }
                // 2. Increment Inventory
                const inventory = yield prisma_1.default.inventory.upsert({
                    where: {
                        product_id_warehouse_id: {
                            product_id: product.id,
                            warehouse_id: warehouseId
                        }
                    },
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
                yield prisma_1.default.immutableLog.create({
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
        });
    }
}
exports.OCRService = OCRService;
