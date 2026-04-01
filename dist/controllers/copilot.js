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
exports.askCoPilot = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const askCoPilot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { message } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!message) {
            res.status(400).json({ message: 'يرجى إدخال سؤالك للمساعد الذكي' });
            return;
        }
        const lowerMsg = message.toLowerCase();
        let response = "عذراً، أنا أتعلم حالياً. هل يمكنك صياغة سؤالك بشكل مختلف؟";
        // 💰 Phase 11: Business Chatbot Insights
        if (lowerMsg.includes('كسبت') || lowerMsg.includes('أرباح') || lowerMsg.includes('profit')) {
            const wallet = yield prisma_1.default.wallet.findUnique({ where: { user_id: userId } });
            const balance = (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0;
            response = `صافي أرباحك المتاحة حالياً في TradeLink Cash هو ${balance} جنيه مصري. لديك أيضاً ${(wallet === null || wallet === void 0 ? void 0 : wallet.escrow_balance) || 0} جنيه في انتظار تأكيد الاستلام.`;
        }
        else if (lowerMsg.includes('مورد') || lowerMsg.includes('supplier')) {
            const slowSuppliers = yield prisma_1.default.order.findMany({
                where: { buyer_id: userId, status: 'pending' },
                include: { seller: true }
            });
            if (slowSuppliers.length > 0) {
                response = `لديك ${slowSuppliers.length} طلبيات متأخرة. المورد "${slowSuppliers[0].seller.company_name}" هو الأكثر تأخراً حالياً.`;
            }
            else {
                response = "كل الموردين ملتزمين بجدول التوريد الخاص بك حالياً. عمل جيد!";
            }
        }
        else if (lowerMsg.includes('مخزن') || lowerMsg.includes('stock')) {
            const lowStock = yield prisma_1.default.inventory.findMany({
                where: {
                    warehouse: { owner_id: userId },
                    quantity: { lt: 10 }
                },
                include: { product: true }
            });
            if (lowStock.length > 0) {
                response = `تنبيه: لديك ${lowStock.length} أصناف أوشكت على النفاذ في مستودعاتك، منها "${lowStock[0].product.name}". هل تريد طلب توريد جديد؟`;
            }
            else {
                response = "مستويات المخزون في جميع مستودعاتك ممتازة ومستقرة.";
            }
        }
        res.json({
            reply: response,
            timestamp: new Date().toISOString(),
            suggestedActions: [
                { label: 'عرض التقارير المالية', action: '/dashboard/reports' },
                { label: 'البحث عن موردين بدلاء', action: '/global/suppliers' }
            ]
        });
    }
    catch (error) {
        console.error('CoPilot Error:', error);
        res.status(500).json({ message: 'خطأ في تشغيل المساعد الذكي' });
    }
});
exports.askCoPilot = askCoPilot;
