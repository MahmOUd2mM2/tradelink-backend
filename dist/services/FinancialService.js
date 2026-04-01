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
exports.FinancialService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class FinancialService {
    /**
     * Automatically clears funds from Escrow to Available Balance
     * Triggered after successful fulfillment verification (OTP/Scan)
     */
    static releaseEscrow(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield prisma_1.default.order.findUnique({
                where: { id: orderId },
                include: { invoices: true }
            });
            if (!order || order.release_status !== 'verified') {
                console.error(`[FINANCE-ERR] Order ${orderId} not verified for release.`);
                return false;
            }
            const paidInvoices = order.invoices.filter(inv => inv.status === 'paid');
            const totalToRelease = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
            if (totalToRelease <= 0)
                return true; // Nothing to release
            try {
                yield prisma_1.default.$transaction([
                    // 1. Update Seller Wallet
                    prisma_1.default.wallet.update({
                        where: { user_id: order.seller_id },
                        data: {
                            escrow_balance: { decrement: totalToRelease },
                            balance: { increment: totalToRelease },
                            transactions: {
                                create: {
                                    type: 'PAYMENT',
                                    amount: totalToRelease,
                                    status: 'completed',
                                    reference: `ESC-REL-${orderId}`,
                                    description: `إصدار دفع فوري للأوردر رقم #${orderId} بمجرد الاستلام الموثق`
                                }
                            }
                        }
                    }),
                    // 2. Mark order as released
                    prisma_1.default.order.update({
                        where: { id: orderId },
                        data: { release_status: 'released' }
                    }),
                    // 3. Create Immutable Audit Log
                    prisma_1.default.immutableLog.create({
                        data: {
                            entity_type: 'Order',
                            entity_id: orderId,
                            action: 'ESCROW_RELEASED',
                            new_state: JSON.stringify({ amount: totalToRelease, target: order.seller_id }),
                            signature: `SIG-fin-rel-${Date.now()}`
                        }
                    })
                ]);
                console.log(`[FINANCE-SUCCESS] Released ${totalToRelease} EGP for Order ${orderId}`);
                return true;
            }
            catch (error) {
                console.error(`[FINANCE-ERR] Failed to release escrow for Order ${orderId}:`, error);
                return false;
            }
        });
    }
    /**
     * Phase 104: Smart Debt Collector
     * Simulates sending a WhatsApp payment link 24h before due
     */
    static sendWhatsAppReminder(userId, invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
            const invoice = yield prisma_1.default.invoice.findUnique({ where: { id: invoiceId } });
            if (!user || !invoice || !user.phone)
                return false;
            const message = `أهلاً ${user.name}، نذكرك بموعد استحقاق الفاتورة #${invoice.invoice_number} بقيمة ${invoice.amount} ج. يمكنك الدفع الآن عبر الرابط: https://tradelink.pro/pay/${invoice.id}`;
            console.log(`[WHATSAPP-MOCK] Sending reminder to ${user.phone}: ${message}`);
            yield prisma_1.default.immutableLog.create({
                data: {
                    entity_type: 'Invoice',
                    entity_id: invoiceId,
                    action: 'WHATSAPP_REMINDER_SENT',
                    new_state: 'SENT'
                }
            });
            return true;
        });
    }
    /**
     * Gets total outstanding debt for a buyer
     */
    static getDebtStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const unpaidInvoices = yield prisma_1.default.invoice.findMany({
                where: {
                    order: { buyer_id: userId },
                    status: 'unpaid'
                }
            });
            const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
            return {
                totalDebt,
                invoiceCount: unpaidInvoices.length,
                nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Simulated
            };
        });
    }
}
exports.FinancialService = FinancialService;
