import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Cleanup existing data to avoid unique constraint errors
  console.log('🧹 Cleaning up old data...');
  await prisma.marketTrend.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.advisorLog.deleteMany();
  await prisma.retentionMetric.deleteMany();
  await prisma.crisisAlert.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  // We keep Roles and Products/Users if they are stable, but for a clean seed, let's keep it minimal for now.
  
  // Create roles
  const roles = ['Admin', 'Supplier', 'Wholesaler', 'Retailer', 'Consumer'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('✅ Roles seeded');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const supplierRole = await prisma.role.findUnique({ where: { name: 'Supplier' } });
  const wholesalerRole = await prisma.role.findUnique({ where: { name: 'Wholesaler' } });
  const retailerRole = await prisma.role.findUnique({ where: { name: 'Retailer' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradelink.com' },
    update: {},
    create: { name: 'مدير النظام', email: 'admin@tradelink.com', password: hashedPassword, role_id: adminRole!.id, company_name: 'TradeLink Pro' }
  });

  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@tradelink.com' },
    update: {},
    create: { name: 'أحمد المورد', email: 'supplier@tradelink.com', password: hashedPassword, role_id: supplierRole!.id, company_name: 'شركة التوريدات المتحدة', phone: '01001234567' }
  });

  const wholesaler = await prisma.user.upsert({
    where: { email: 'wholesaler@tradelink.com' },
    update: {},
    create: { name: 'محمد الجملة', email: 'wholesaler@tradelink.com', password: hashedPassword, role_id: wholesalerRole!.id, company_name: 'هايبر سيتي للجملة', phone: '01101234567' }
  });

  const retailer = await prisma.user.upsert({
    where: { email: 'retailer@tradelink.com' },
    update: {},
    create: { name: 'خالد التجزئة', email: 'retailer@tradelink.com', password: hashedPassword, role_id: retailerRole!.id, company_name: 'سوبر ماركت النور', phone: '01201234567' }
  });

  const userAccount = await prisma.user.upsert({
    where: { email: 'mahmoudothman22903@gmail.com' },
    update: { role_id: supplierRole!.id, company_name: 'تريدلينك إنتربرايز' },
    create: { name: 'محمود عثمان', email: 'mahmoudothman22903@gmail.com', password: hashedPassword, role_id: supplierRole!.id, company_name: 'تريدلينك إنتربرايز', phone: '01006513814' }
  });
  console.log('✅ Users seeded');

  // Create products
  const products = [
    { name: 'زيت عباد الشمس 1 لتر', sku: 'OIL-SUN-1L', price: 45.50, min_order_qty: 24, supplier_id: userAccount.id },
    { name: 'سكر أبيض 1 كجم', sku: 'SUG-WHT-1K', price: 28.00, min_order_qty: 50, supplier_id: userAccount.id },
    { name: 'أرز مصري 5 كجم', sku: 'RIC-EGY-5K', price: 85.00, min_order_qty: 20, supplier_id: userAccount.id },
    { name: 'مكرونة اسباجيتي 500 جم', sku: 'PAS-SPG-500', price: 15.50, min_order_qty: 48, supplier_id: userAccount.id },
    { name: 'شاي أسود 250 جم', sku: 'TEA-BLK-250', price: 35.00, min_order_qty: 30, supplier_id: userAccount.id },
    { name: 'صلصة طماطم 400 جم', sku: 'SAU-TOM-400', price: 12.00, min_order_qty: 36, supplier_id: userAccount.id },
    { name: 'جبنة بيضاء 500 جم', sku: 'CHS-WHT-500', price: 42.00, min_order_qty: 12, supplier_id: userAccount.id },
    { name: 'لبن كامل الدسم 1 لتر', sku: 'MLK-FUL-1L', price: 38.00, min_order_qty: 12, supplier_id: userAccount.id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }
  console.log('✅ Products seeded');

  // Create warehouses
  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: { owner_id: supplier.id, city: 'القاهرة', address: 'المنطقة الصناعية - العبور', capacity: 5000 }
  });

  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: { owner_id: supplier.id, city: 'الإسكندرية', address: 'المنطقة الحرة - العامرية', capacity: 3000 }
  });
  console.log('✅ Warehouses seeded');

  // Create inventory
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    const existing = await prisma.inventory.findFirst({ where: { product_id: product.id, warehouse_id: warehouse1.id } });
    if (!existing) {
      await prisma.inventory.create({
        data: { product_id: product.id, warehouse_id: warehouse1.id, quantity: Math.floor(Math.random() * 500) + 100 }
      });
    }
    const existing2 = await prisma.inventory.findFirst({ where: { product_id: product.id, warehouse_id: warehouse2.id } });
    if (!existing2) {
      await prisma.inventory.create({
        data: { product_id: product.id, warehouse_id: warehouse2.id, quantity: Math.floor(Math.random() * 300) + 50 }
      });
    }
  }
  console.log('✅ Inventory seeded');

  // Create sample orders
  const sampleProducts = await prisma.product.findMany({ take: 3 });
  
  const order1 = await prisma.order.create({
    data: {
      buyer_id: retailer.id,
      seller_id: supplier.id,
      total_amount: 4500,
      status: 'delivered',
      items: {
        create: sampleProducts.map(p => ({
          product_id: p.id,
          quantity: 10,
          unit_price: p.price
        }))
      }
    }
  });

  const order2 = await prisma.order.create({
    data: {
      buyer_id: wholesaler.id,
      seller_id: supplier.id,
      total_amount: 12500,
      status: 'shipped',
      items: {
        create: sampleProducts.slice(0, 2).map(p => ({
          product_id: p.id,
          quantity: 50,
          unit_price: p.price
        }))
      }
    }
  });

  const order3 = await prisma.order.create({
    data: {
      buyer_id: retailer.id,
      seller_id: userAccount.id,
      total_amount: 8200,
      status: 'pending',
      items: {
        create: [{ product_id: sampleProducts[0].id, quantity: 100, unit_price: sampleProducts[0].price }]
      }
    }
  });

  const order4 = await prisma.order.create({
    data: {
      buyer_id: wholesaler.id,
      seller_id: userAccount.id,
      total_amount: 35000,
      status: 'delivered',
      items: {
        create: sampleProducts.map(p => ({
          product_id: p.id,
          quantity: 100,
          unit_price: p.price
        }))
      }
    }
  });

  const order5 = await prisma.order.create({
    data: {
      buyer_id: retailer.id,
      seller_id: userAccount.id,
      total_amount: 15200,
      status: 'shipped',
      items: {
        create: [{ product_id: sampleProducts[1].id, quantity: 200, unit_price: sampleProducts[1].price }]
      }
    }
  });
  console.log('✅ Orders seeded');

  // Create invoices
  await prisma.invoice.createMany({
    data: [
      { order_id: order1.id, invoice_number: 'INV-TRD-001', amount: 4500, status: 'paid' },
      { order_id: order2.id, invoice_number: 'INV-TRD-002', amount: 12500, status: 'unpaid' },
      { order_id: order3.id, invoice_number: 'INV-TRD-003', amount: 8200, status: 'unpaid' },
      { order_id: order4.id, invoice_number: 'INV-TRD-004', amount: 35000, status: 'paid' },
      { order_id: order5.id, invoice_number: 'INV-TRD-005', amount: 15200, status: 'unpaid' },
    ]
  });
  console.log('✅ Invoices seeded');

  // Create payments
  await prisma.payment.createMany({
    data: [
      { order_id: order1.id, method: 'bank_transfer', amount: 4500, status: 'completed', transaction_ref: 'PAY-SEED-001' },
      { order_id: order2.id, method: 'escrow', amount: 12500, status: 'pending', transaction_ref: 'PAY-SEED-002' },
    ]
  });
  console.log('✅ Payments seeded');

  // Create shipments
  await prisma.shipment.createMany({
    data: [
      { order_id: order1.id, company: 'TradeLink Logistics', tracking_number: 'TRK-SEED-001', status: 'delivered' },
      { order_id: order2.id, company: 'سبيدي إيجبت', tracking_number: 'TRK-SEED-002', status: 'in_transit' },
    ]
  });
  console.log('✅ Shipments seeded');

  // Create crisis alerts
  await prisma.crisisAlert.createMany({
    data: [
      { title: 'ارتفاع أسعار السكر', description: 'من المتوقع ارتفاع أسعار السكر بنسبة 5% الأسبوع القادم بسبب نقص المعروض العالمي', severity: 'high', region: 'مصر' },
      { title: 'تأخر شحنات الأرز', description: 'تأخر محتمل في شحنات الأرز من آسيا بسبب اضطرابات الشحن البحري', severity: 'medium', region: 'آسيا' },
      { title: 'استقرار أسعار الزيوت', description: 'استقرار نسبي في أسعار الزيوت مع توقعات بالحفاظ على المستويات الحالية', severity: 'low', region: 'الشرق الأوسط' },
    ]
  });
  console.log('✅ Crisis alerts seeded');

  // Create retention metrics
  await prisma.retentionMetric.createMany({
    data: [
      { user_id: retailer.id, loyalty_score: 85.5, churn_risk: 'low' },
      { user_id: wholesaler.id, loyalty_score: 62.3, churn_risk: 'medium' },
    ]
  });
  console.log('✅ Retention metrics seeded');

  // Create advisor logs
  await prisma.advisorLog.createMany({
    data: [
      { category: 'inventory', message: 'من المتوقع أن يرتفع استهلاك زيوت الطهي بنسبة 15% في منطقة الدلتا الأسبوع القادم بسبب الأنماط الموسمية', metadata: '{"region":"delta","product":"cooking_oil","confidence":0.87}' },
      { category: 'crisis', message: 'تنبيه: نقص في مخزون السكر الأبيض - يُنصح بالتأمين خلال 48 ساعة', metadata: '{"product":"sugar","urgency":"high"}' },
      { category: 'retention', message: 'العميل هايبر سيتي لم يُصدر طلبات منذ 15 يوماً - خطر انصراف متوسط', metadata: '{"user_id":3,"days_inactive":15}' },
      { category: 'debt', message: 'فاتورة INV-TRD-002 متأخرة عن السداد - المبلغ 12,500 ج.م', metadata: '{"invoice":"INV-TRD-002","amount":12500}' },
    ]
  });
  console.log('✅ Advisor logs seeded');

  // Create wallets for all users
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    await prisma.wallet.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        balance: 25000.00, // Starting balance for all test users
        currency: 'EGP',
        transactions: {
          create: {
            type: 'DEPOSIT',
            amount: 25000.00,
            status: 'completed',
            reference: `SEED-INIT-${user.id}`,
            description: 'Initial Seed Balance'
          }
        }
      }
    });
  }
  console.log('✅ Wallets seeded');

  // Create market trends
  await prisma.marketTrend.createMany({
    data: [
      { symbol: 'SUG', name: 'السكر الأبيض', price: 28.50, change_24h: 5.2, unit: 'كجم' },
      { symbol: 'OIL', name: 'زيت عباد الشمس', price: 46.00, change_24h: -1.5, unit: 'لتر' },
      { symbol: 'RIC', name: 'الأرز المصري', price: 86.00, change_24h: 0.8, unit: '5 كجم' },
      { symbol: 'FLR', name: 'الدقيق الفاخر', price: 22.00, change_24h: 3.1, unit: 'كجم' },
    ]
  });
  console.log('✅ Market trends seeded');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('   Admin:      admin@tradelink.com / password123');
  console.log('   Supplier:   supplier@tradelink.com / password123');
  console.log('   Wholesaler: wholesaler@tradelink.com / password123');
  console.log('   Retailer:   retailer@tradelink.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
