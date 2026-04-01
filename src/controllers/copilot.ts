import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const askCoPilot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const userId = req.user?.userId;

    if (!message) {
      res.status(400).json({ message: 'يرجى إدخال سؤالك للمساعد الذكي' });
      return;
    }

    const lowerMsg = message.toLowerCase();
    let response = "عذراً، أنا أتعلم حالياً. هل يمكنك صياغة سؤالك بشكل مختلف؟";

    // 💰 Phase 11: Business Chatbot Insights
    if (lowerMsg.includes('كسبت') || lowerMsg.includes('أرباح') || lowerMsg.includes('profit')) {
      const wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
      const balance = wallet?.balance || 0;
      response = `صافي أرباحك المتاحة حالياً في TradeLink Cash هو ${balance} جنيه مصري. لديك أيضاً ${wallet?.escrow_balance || 0} جنيه في انتظار تأكيد الاستلام.`;
    } 
    else if (lowerMsg.includes('سمعتي') || lowerMsg.includes('reputation') || lowerMsg.includes('score')) {
      const { ReputationService } = require('../services/ReputationService');
      const scoreData = await ReputationService.calculateTradeScore(userId);
      response = `سمعتك التجارية حالياً هى "${scoreData.badge}" برصيد ${scoreData.score} نقطة. مستوى حسابك هو ${scoreData.level}. أنت الآن مؤهل للحصول على التمويل بضمان نشاطك!`;
    }
    else if (lowerMsg.includes('مورد') || lowerMsg.includes('supplier')) {
      const slowSuppliers = await prisma.order.findMany({
        where: { buyer_id: userId, status: 'pending' },
        include: { seller: true }
      });
      if (slowSuppliers.length > 0) {
        response = `لديك ${slowSuppliers.length} طلبيات متأخرة. المورد "${slowSuppliers[0].seller.company_name}" هو الأكثر تأخراً حالياً.`;
      } else {
        response = "كل الموردين ملتزمين بجدول التوريد الخاص بك حالياً. عمل جيد!";
      }
    }
    else if (lowerMsg.includes('مخزن') || lowerMsg.includes('stock')) {
      const lowStock = await prisma.inventory.findMany({
        where: { 
          warehouse: { owner_id: userId }, 
          quantity: { lt: 50 } // Increased threshold for "Proactive" advice
        },
        include: { product: true }
      });
      if (lowStock.length > 0) {
        const { AlternativeSupplierEngine } = require('../services/AlternativeSupplierEngine');
        const alt = await AlternativeSupplierEngine.findAlternatives(lowStock[0].product_id, lowStock[0].product.supplier_id);
        
        response = `تنبيه: لديك ${lowStock.length} أصناف أوشكت على النفاذ، منها "${lowStock[0].product.name}". `;
        if (alt.suggestions.length > 0) {
          response += `لقد وجدت لك مورد بأسعار أفضل: المورد "${alt.suggestions[0].supplierName}" يوفر نفس المنتج بسعر ${alt.suggestions[0].price} ج.م. هل تريد التواصل معه؟`;
        } else {
          response += `هل تريد طلب توريد جديد؟`;
        }
      } else {
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
  } catch (error) {
    console.error('CoPilot Error:', error);
    res.status(500).json({ message: 'خطأ في تشغيل المساعد الذكي' });
  }
};
