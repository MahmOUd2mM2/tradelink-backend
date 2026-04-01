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
exports.PricingEngine = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class PricingEngine {
    static calculatePrice(productId, quantity, buyerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const product = yield prisma_1.default.product.findUnique({
                where: { id: productId },
                include: {
                    inventory: {
                        include: { warehouse: { include: { owner: true } } }
                    }
                }
            });
            if (!product)
                throw new Error('Product not found');
            const supplierId = (_a = product.inventory[0]) === null || _a === void 0 ? void 0 : _a.warehouse.owner.id;
            let unitPrice = Number(product.price);
            const appliedDiscounts = [];
            // 1. Tiered Pricing (Maksab/Cartona style)
            if (product.min_bulk_qty && quantity >= product.min_bulk_qty && product.bulk_price) {
                unitPrice = Number(product.bulk_price);
                appliedDiscounts.push(`خصم الكمية (Bulk): ${unitPrice} ج.م`);
            }
            // 2. Rule-Based Dynamic Pricing (Enterprise style)
            if (supplierId) {
                const buyer = yield prisma_1.default.user.findUnique({ where: { id: buyerId } });
                const rules = yield prisma_1.default.discountRule.findMany({
                    where: { supplier_id: supplierId, is_active: true }
                });
                for (const rule of rules) {
                    let ruleApplied = true;
                    if (rule.min_qty && quantity < rule.min_qty)
                        ruleApplied = false;
                    if (rule.min_score && (buyer === null || buyer === void 0 ? void 0 : buyer.score) < rule.min_score)
                        ruleApplied = false;
                    if (ruleApplied) {
                        const discountAmount = unitPrice * (rule.discount_pct / 100);
                        unitPrice -= discountAmount;
                        appliedDiscounts.push(`قاعدة خصم المورد: -${rule.discount_pct}%`);
                    }
                }
            }
            return {
                unitPrice,
                totalAmount: unitPrice * quantity,
                appliedDiscounts
            };
        });
    }
}
exports.PricingEngine = PricingEngine;
