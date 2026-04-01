import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { CrisisRadarService } from '../services/CrisisRadarService';

export const getMarketInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const trends = await CrisisRadarService.getGlobalTrends();
    const suggestions = userId ? await CrisisRadarService.suggestStockOptimization(userId) : [];

    res.status(200).json({
      trends,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('getMarketInsights Error:', error);
    res.status(500).json({ message: 'Error fetching market insights' });
  }
};

import { AlternativeSupplierEngine } from '../services/AlternativeSupplierEngine';

export const getAlternatives = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { excludeSupplierId } = req.query;

    if (!productId) {
      res.status(400).json({ message: 'Missing productId' });
      return;
    }

    const data = await AlternativeSupplierEngine.findAlternatives(
      Number(productId), 
      excludeSupplierId ? Number(excludeSupplierId) : 0
    );

    res.status(200).json(data);
  } catch (error) {
    console.error('getAlternatives Error:', error);
    res.status(500).json({ message: 'Error fetching alternative suppliers' });
  }
};

export const getCrisisAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const alerts = await prisma.crisisAlert.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
    });
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Error fetching crisis alerts:', error);
    res.status(500).json({ message: 'Error fetching crisis alerts' });
  }
};

export const getRetentionMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await prisma.retentionMetric.findMany({
      include: { user: { select: { name: true, company_name: true } } },
      orderBy: { loyalty_score: 'asc' }, 
    });
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching retention metrics:', error);
    res.status(500).json({ message: 'Error fetching retention metrics' });
  }
};

export const getDebtCollectionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalOverdue = await prisma.invoice.aggregate({
      where: { status: 'unpaid' },
      _sum: { amount: true },
    });

    const highRiskDebtors = await prisma.invoice.findMany({
      where: { status: 'unpaid' },
      include: { order: { include: { buyer: true } } },
      orderBy: { amount: 'desc' },
      take: 10,
    });

    res.status(200).json({
      totalOverdue: totalOverdue._sum.amount || 0,
      highRiskDebtors,
    });
  } catch (error) {
    console.error('Error fetching debt collection stats:', error);
    res.status(500).json({ message: 'Error fetching debt collection stats' });
  }
};

export const getInventoryAIInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        inventory: {
          some: {
            quantity: { lt: 10 }
          }
        }
      },
      take: 3
    });

    if (lowStockProducts.length > 0) {
      const productNames = lowStockProducts.map(p => p.name).join(' و ');
      res.status(200).json({
        message: `تنبيه: مستويات المخزون منخفضة لـ (${productNames}). ننصح بطلب كميات جديدة لتجنب نفاد الكمية.`,
        category: 'inventory',
        created_at: new Date()
      });
    } else {
      res.status(200).json({
        message: 'جميع مستويات المخزون مستقرة حالياً. لا توجد مخاطر فورية لنفاد الكمية.',
        category: 'inventory',
        created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching inventory AI insight:', error);
    res.status(500).json({ message: 'Error fetching inventory AI insight' });
  }
};

export const getMarketTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const trends = await prisma.marketTrend.findMany({
      orderBy: { last_update: 'desc' },
    });
    res.status(200).json(trends);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    res.status(500).json({ message: 'Error fetching market trends' });
  }
};

// --- B2B Trade & Sourcing Extensions ---

export const submitQuoteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId, productId, message, quantity } = req.body;
    const buyerId = req.user?.userId;

    if (!sellerId || !message) {
      res.status(400).json({ message: 'Missing sellerId or message' });
      return;
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        buyer_id: Number(buyerId),
        seller_id: Number(sellerId),
        product_id: productId ? Number(productId) : null,
        message,
        quantity: quantity ? Number(quantity) : null,
      }
    });

    res.status(201).json({ message: 'تم إرسال طلب عرض السعر بنجاح', quote });
  } catch (error) {
    console.error('submitQuoteRequest Error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال طلب السعر' });
  }
};

export const getSupplierAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const supplier = await prisma.user.findUnique({
      where: { id },
      include: { products: true, reviews_received: true }
    });

    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    // Mock Analytics for the "Details" modal
    res.status(200).json({
      supplier,
      stats: {
        reliability: 0.98,
        onTimeDelivery: 0.95,
        totalTradeVolume: (id * 150000) + 500000,
        activeContracts: 12,
        topRegion: 'القاهرة والكبرى',
        certificates: ['ISO 9001', 'HACCP', 'ETA Compliant']
      }
    });
  } catch (error) {
    console.error('getSupplierAnalytics Error:', error);
    res.status(500).json({ message: 'Error fetching supplier analytics' });
  }
};

// --- AI Brain & CoPilot V2 (Advanced Training) ---

const KNOWLEDGE_BASE = [
  {
    intent: 'Logistics',
    keywords: ['شحن', 'توصيل', 'مخزن', 'warehouse', 'shipping', 'delivery', 'تتبع', 'وصلت', 'فين'],
    responses: [
      "نحن نستخدم أسطولاً ذكياً لتوزيع المنتجات في كافة أنحاء مصر. يمكنك تتبع شحنتك لحظياً من لوحة التحكم.",
      "مخازننا في القاهرة والإسكندرية مجهزة بأحدث تقنيات التوأم الرقمي (3D Twin) لضمان دقة التوريد."
    ]
  },
  {
    intent: 'Financial',
    keywords: ['فلوس', 'رصيد', 'دفع', 'محفظة', 'money', 'payment', 'wallet', 'bank', 'تحويل', 'حساب', 'سحب', 'ايداع'],
    responses: [
      "محفظة TradeLink Cash توفر لك أماناً كاملاً عبر نظام الضمان (Escrow). لا يتم صرف المستحقات للمورد إلا بعد استلامك للبضاعة.",
      "يمكنك شحن رصيدك عبر InstaPay أو فوري أو البطاقات البنكية بكل سهولة."
    ]
  },
  {
    intent: 'Market',
    keywords: ['سعر', 'سوق', 'أسعار', 'تقلبات', 'market', 'price', 'trends', 'أزمة', 'بورصة', 'عالمي'],
    responses: [
      "رادار الأزمات لدينا يراقب البورصات العالمية (القمح، الزيوت، السكر) على مدار الساعة لينبهك بأي تغير مفاجئ قبل حدوثه.",
      "السوق المصري يشهد حالياً استقراراً في بعض السلع، لكننا ننصح دائماً بتأمين مخزون استراتيجي للمواد الخام."
    ]
  },
  {
    intent: 'AddProduct',
    keywords: ['ضيف', 'ضف', 'اضافه', 'منتج', 'سلعة', 'ابيع', 'عرض', 'بيع', 'ادخال', 'سجل'],
    responses: [
      "حاضر! يمكنك إضافة منتجاتك بسهولة من قسم 'المخزون'، أو أخبرني باسم المنتج وسعره وسأقوم بجدولته لك.",
      "تم تفعيل ميزة الإضافة السريعة. هل تريد إضافة 'سكر' أو 'زيت' أو 'دقيق'؟"
    ]
  },
  {
    intent: 'Analysis',
    keywords: ['تحليل', 'مبيعات', 'تقرير', 'يومي', 'اسبوعي', 'شهري', 'ارباح', 'خساير', 'ادائي', 'بنزيد'],
    responses: [
      "جاري تحليل بياناتك... مبيعاتك الأسبوعية في ارتفاع بنسبة 12% مقارنة بمنتصف الشهر.",
      "حسب تحليلي لـ Maksab و Cartona، أداؤك في منطقة الدلتا هو الأقوى حالياً."
    ]
  },
  {
    intent: 'Profit',
    keywords: ['ربح', 'ارباح', 'صافي', 'كسبت', 'كام', 'profit', 'net', 'income'],
    responses: [
      "حسب بيانات الفواتير المسددة، صافي ربحك لهذا الشهر هو {{PROFIT}} ج.م. أداء ممتاز!",
      "تحليل الربحية: هامش الربح الحالي هو 18%، وهو أعلى من متوسط السوق بنسبة 3%."
    ]
  }
];

export const getCoPilotResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, message } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { 
        wallet: true, 
        role: true, 
        buyer_orders: { take: 5, orderBy: { created_at: 'desc' } },
        products: { take: 10 }
      }
    });

    if (!user) {
      res.status(200).json({ response: 'أهلاً بك! يرجى تسجيل الدخول للحصول على نصائح مخصصة لأعمالك.' });
      return;
    }

    const lowerMessage = message.toLowerCase();
    
    // 1. Detect Intent
    let bestMatch = { intent: null as string | null, score: 0 };
    KNOWLEDGE_BASE.forEach(kb => {
      const matchCount = kb.keywords.filter(k => lowerMessage.includes(k)).length;
      if (matchCount > bestMatch.score) bestMatch = { intent: kb.intent, score: matchCount };
    });

    let response = "";
    
    // 2. Specialized Intent Logic
    if (bestMatch.intent === 'AddProduct') {
      // Mock fast product addition
      if (lowerMessage.includes('سكر') || lowerMessage.includes('sugar')) {
         response = "حاضر، سأضيف 'سكر أبيض' لقائمة منتجاتك بسعر السوق الحالي (28500 ج.م للطن). هل تود التأكيد؟";
      } else {
         response = "فهمت! لنتجه إلى صفحة 'إضافة منتج' لإدخال التفاصيل، أو قولي 'ضيف سكر' وسأتكفل بالباقي.";
      }
    } 
    else if (bestMatch.intent === 'Analysis' || bestMatch.intent === 'Profit') {
       const todayOrders = await prisma.order.count({ where: { buyer_id: user.id, created_at: { gte: new Date(new Date().setHours(0,0,0,0)) } } });
       const totalSpent = (user as any).buyer_orders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0);
       const profit = (totalSpent * 0.15).toLocaleString(); // Mock 15% margin
       
       if (lowerMessage.includes('يومي')) {
          response = `اليوم قمت بـ ${todayOrders} معاملات. نشاطك مستقر جداً اليوم.`;
       } else if (lowerMessage.includes('ارباح') || lowerMessage.includes('ربح') || lowerMessage.includes('profit')) {
          response = `صافي أرباحك المقدرة لهذا الشهر هي ${profit} ج.م. هل تود رؤية التقرير المفصل؟`;
       } else if (lowerMessage.includes('اسبوعي')) {
          response = `أداؤك الأسبوعي ممتاز، إجمالي المبيعات/المشتريات تجاوز ${totalSpent.toLocaleString()} ج.م.`;
       } else {
          response = `التحليل الشهري: رصيدك في المحفظة هو ${Number((user as any).wallet?.balance || 0).toLocaleString()} ج.م، وعدد المنتجات النشطة لديك هو ${(user as any).products.length}.`;
       }
    }
    else if (bestMatch.intent === 'Financial') {
       response = `رصيدك المتاح هو ${Number((user as any).wallet?.balance || 0).toLocaleString()} ج.م. للعلم: ${KNOWLEDGE_BASE[1].responses[0]}`;
    }
    else if (bestMatch.intent === 'Logistics') {
       response = KNOWLEDGE_BASE[0].responses[1];
    }
    else if (bestMatch.intent === 'Market') {
       const trend = await prisma.marketTrend.findFirst({ orderBy: { change_24h: 'desc' } });
       response = `السوق يتحرك! مثلاً ${trend?.name} ارتفع بنسبة ${trend?.change_24h}%. ${KNOWLEDGE_BASE[2].responses[0]}`;
    }
    else if (lowerMessage.includes('مكسب') || lowerMessage.includes('كرتونه')) {
       response = "نحن نوفر لك مميزات تضاهي Maksab و Cartona، مع إضافة تكنولوجيا التوأم الرقمي (3D) لتتبع مخازنك لحظياً!";
    }
    else {
      response = "أهلاً بك في TradeLink Pro! هل تريد مني تحليل 'مبيعاتك اليومية'، 'إضافة منتج'، أو تزويدك بآخر 'أخبار القناة والسوق'؟ أنا أسمعك!";
    }

    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ message: 'Error in CoPilot' });
  }
};

import { CoopService } from '../services/CoopService';

export const getCoops = async (req: Request, res: Response): Promise<void> => {
  try {
    const coops = await CoopService.getActiveCoops();
    res.status(200).json(coops);
  } catch (error) {
    console.error('getCoops Error:', error);
    res.status(500).json({ message: 'Error fetching cooperatives' });
  }
};

export const submitReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, sellerId, rating, comment } = req.body;
    const buyerId = req.user?.userId;
    const review = await prisma.review.create({
      data: { order_id: Number(orderId), buyer_id: Number(buyerId), seller_id: Number(sellerId), rating: Number(rating), comment }
    });
    res.status(201).json({ message: 'تم التقييم بنجاح', review });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التقييم' });
  }
};

export const getSupplierReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const reviews = await prisma.review.findMany({ where: { seller_id: id }, include: { buyer: { select: { name: true } } } });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب التقييمات' });
  }
};
