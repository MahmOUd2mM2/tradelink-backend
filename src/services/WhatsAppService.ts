import prisma from '../prisma';

export class WhatsAppService {
  /**
   * Generates a WhatsApp payment reminder link
   */
  static generatePaymentLink(phone: string, invoiceNumber: string, amount: number): string {
    const message = `مرحباً، يرجى سداد الفاتورة رقم ${invoiceNumber} بمبلغ ${amount} ج.م عبر منصة TradeLink Pro. يمكنك السداد هنا: https://tradelink.pro/pay/${invoiceNumber}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  /**
   * Triggers an automated debt collection reminder
   */
  static async triggerCollectionReminder(invoiceId: number) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { buyer: true } } }
    });

    if (!invoice || invoice.status !== 'unpaid') return null;

    const buyer = invoice.order.buyer;
    if (!buyer.phone) return null;

    const link = this.generatePaymentLink(buyer.phone, invoice.invoice_number, Number(invoice.amount));
    
    console.log(`[WhatsApp] Collection reminder sent to ${buyer.phone} for Invoice ${invoice.invoice_number}`);
    return link;
  }
}
