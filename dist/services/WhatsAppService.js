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
exports.WhatsAppService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class WhatsAppService {
    /**
     * Generates a WhatsApp payment reminder link
     */
    static generatePaymentLink(phone, invoiceNumber, amount) {
        const message = `مرحباً، يرجى سداد الفاتورة رقم ${invoiceNumber} بمبلغ ${amount} ج.م عبر منصة TradeLink Pro. يمكنك السداد هنا: https://tradelink.pro/pay/${invoiceNumber}`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    }
    /**
     * Triggers an automated debt collection reminder
     */
    static triggerCollectionReminder(invoiceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const invoice = yield prisma_1.default.invoice.findUnique({
                where: { id: invoiceId },
                include: { order: { include: { buyer: true } } }
            });
            if (!invoice || invoice.status !== 'unpaid')
                return null;
            const buyer = invoice.order.buyer;
            if (!buyer.phone)
                return null;
            const link = this.generatePaymentLink(buyer.phone, invoice.invoice_number, Number(invoice.amount));
            console.log(`[WhatsApp] Collection reminder sent to ${buyer.phone} for Invoice ${invoice.invoice_number}`);
            return link;
        });
    }
}
exports.WhatsAppService = WhatsAppService;
