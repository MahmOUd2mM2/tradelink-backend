import prisma from '../prisma';

export class ReportingService {
  /**
   * Simulates generating a high-end weekly performance PDF
   */
  static async generateWeeklyPDF() {
    console.log('[BI] Aggregating weekly data for PDF generation...');
    
    // Aggregate data
    const totalSales = await prisma.order.aggregate({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        status: 'delivered'
      },
      _sum: { total_amount: true }
    });

    const activeSuppliers = await prisma.user.count({ where: { role: { name: 'Supplier' } } });
    
    console.log(`[BI] Weekly Report: Total Sales ${totalSales._sum.total_amount || 0} EGP, Active Suppliers: ${activeSuppliers}`);
    console.log('[BI] PDF Generated: weekly_report_march_29.pdf (Mock)');
  }

  /**
   * Simulates sending a "Business Health" email to the user
   */
  static async sendHealthEmail() {
    console.log('[BI] Analyzing business health metrics...');
    
    // Mock health scores
    const healthScore = 85; 
    const advice = "⚠️ مخزون السكر ينخفض بنسبة 15%. ننصح بطلب كمية جديدة قبل نهاية الأسبوع.";

    console.log(`[BI] Email Sent: Your Business Health Score is ${healthScore}/100`);
    console.log(`[BI] AI Advice: ${advice}`);
  }
}
