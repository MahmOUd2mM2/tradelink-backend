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
exports.AlternativeSupplierEngine = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class AlternativeSupplierEngine {
    /**
     * Phase 2: Alternative Supplier Finder
     * Suggests alternatives when a primary supplier is out of stock or delayed
     */
    static findAlternatives(productId, excludedSupplierId) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalProduct = yield prisma_1.default.product.findUnique({
                where: { id: productId },
                include: { supplier: true }
            });
            if (!originalProduct)
                throw new Error('Product not found');
            // 1. Find similar products (by name/sku prefix) from other suppliers
            const alternatives = yield prisma_1.default.product.findMany({
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
        });
    }
}
exports.AlternativeSupplierEngine = AlternativeSupplierEngine;
