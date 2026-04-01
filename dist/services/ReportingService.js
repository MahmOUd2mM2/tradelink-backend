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
exports.ReportingService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class ReportingService {
    /**
     * Simulates generating a high-end weekly performance PDF
     */
    static generateWeeklyPDF() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[BI] Aggregating weekly data for PDF generation...');
            // Aggregate data
            const totalSales = yield prisma_1.default.order.aggregate({
                where: {
                    created_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    },
                    status: 'delivered'
                },
                _sum: { total_amount: true }
            });
            const activeSuppliers = yield prisma_1.default.user.count({ where: { role: { name: 'Supplier' } } });
            console.log(`[BI] Weekly Report: Total Sales ${totalSales._sum.total_amount || 0} EGP, Active Suppliers: ${activeSuppliers}`);
            console.log('[BI] PDF Generated: weekly_report_march_29.pdf (Mock)');
        });
    }
    /**
     * Simulates sending a "Business Health" email to the user
     */
    static sendHealthEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[BI] Analyzing business health metrics...');
            // Mock health scores
            const healthScore = 85;
            const advice = "⚠️ مخزون السكر ينخفض بنسبة 15%. ننصح بطلب كمية جديدة قبل نهاية الأسبوع.";
            console.log(`[BI] Email Sent: Your Business Health Score is ${healthScore}/100`);
            console.log(`[BI] AI Advice: ${advice}`);
        });
    }
}
exports.ReportingService = ReportingService;
