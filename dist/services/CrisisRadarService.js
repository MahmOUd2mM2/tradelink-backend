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
exports.CrisisRadarService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class CrisisRadarService {
    /**
     * Simulates tracking global commodity indices and Egyptian market gaps
     */
    static getGlobalTrends() {
        return __awaiter(this, void 0, void 0, function* () {
            // 🌍 Simulated Global Indices (Phase 24: Global Commodity Index)
            const baseTrends = [
                { symbol: 'SUGAR-LME', name: 'السكر الأبيض (لندن)', currentPrice: 620, change24h: 5.2 },
                { symbol: 'WHEAT-CBOT', name: 'القمح (شيكاغو)', currentPrice: 215, change24h: -1.5 },
                { symbol: 'OIL-BRENT', name: 'زيت النخيل الخام', currentPrice: 950, change24h: 3.8 }
            ];
            return baseTrends.map(t => {
                let alert = null;
                let severity = 'low';
                if (t.change24h > 4) {
                    alert = `🚨 رادار الأزمات: ارتفاع حاد في ${t.name} عالمياً بنسبة ${t.change24h}%. متوقع تأثر السوق المحلي خلال 7 أيام.`;
                    severity = 'high';
                }
                else if (t.change24h > 2) {
                    alert = `⚠️ تنبيه: زيادة طفيفة في أسعار ${t.name}. راقب مخزونك.`;
                    severity = 'medium';
                }
                return Object.assign(Object.assign({}, t), { alert,
                    severity });
            });
        });
    }
    /**
     * Suggests alternative suppliers for a given product (Phase 6: Supplier Alternatives)
     */
    static getAlternativeSuppliers(productId, excludeSupplierId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield prisma_1.default.product.findUnique({ where: { id: productId } });
            if (!product)
                return [];
            // Find other suppliers with same name/category or SKU pattern
            const alternatives = yield prisma_1.default.product.findMany({
                where: {
                    name: { contains: product.name.split(' ')[0] }, // Match first word
                    id: { not: productId },
                    supplier_id: { not: excludeSupplierId },
                    status: 'active'
                },
                include: {
                    supplier: {
                        select: { company_name: true, city: true, verified: true }
                    }
                },
                take: 3
            });
            return alternatives.map(a => ({
                id: a.id,
                name: a.name,
                supplier: a.supplier.company_name,
                location: a.supplier.city,
                price: a.price,
                isVerified: a.supplier.verified
            }));
        });
    }
}
exports.CrisisRadarService = CrisisRadarService;
