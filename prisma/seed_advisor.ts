import prisma from '../src/prisma';

async function main() {
  console.log('Seeding Global Advisor & Trade Ecosystem Data...');

  // 0. Build comprehensive Role system
  const allRoles = ['Admin', 'Supplier', 'Wholesaler', 'Retailer', 'Consumer', 'Manufacturer', 'Logistics', 'Distributor'];
  for (const r of allRoles) {
    await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } });
  }

  const roleMap: any = {};
  const roles = await prisma.role.findMany();
  roles.forEach(r => roleMap[r.name] = r.id);

  // 1. Seed New Egyptian Trade Players
  const tradePlayers = [
    { name: 'شركة الصناعات الغذائية الكبرى', company: 'Cairo Manufacturing Co.', role: 'Manufacturer', governorate: 'القاهرة', city: 'مدينة نصر', email: 'factory1@egypt.com' },
    { name: 'الشركة الدولية للنقل اللوجستي', company: 'Int Logis Egypt', role: 'Logistics', governorate: 'الجيزة', city: '6 أكتوبر', email: 'logistics1@egypt.com' },
    { name: 'مجموعة الموزعين المعتمدين', company: 'Delta Distributors', role: 'Distributor', governorate: 'الدقهلية', city: 'المنصورة', email: 'dist1@egypt.com' },
    { name: 'بورسعيد للاستيراد والتصدير', company: 'Port Said Global', role: 'Supplier', governorate: 'بورسعيد', city: 'حي الشرق', email: 'portsaid@egypt.com' },
    { name: 'أسوان للطاقة الشمسية', company: 'Aswan Solar Solutions', role: 'Manufacturer', governorate: 'أسوان', city: 'أسوان', email: 'aswan@egypt.com' },
    { name: 'منتجات البحر الأحمر السمكية', company: 'Red Sea Fisheries', role: 'Supplier', governorate: 'البحر الأحمر', city: 'الغردقة', email: 'redsea@egypt.com' },
  ];

  for (const p of tradePlayers) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        password: 'password123',
        company_name: p.company,
        role_id: roleMap[p.role],
        governorate: p.governorate as any,
        city: p.city,
        verified: true,
        phone_verified: true,
        phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`
      }
    });
  }

  // 2. Crisis Alerts
  await prisma.crisisAlert.deleteMany({});
  await prisma.crisisAlert.createMany({
    data: [
      {
        title: 'اضطراب ملاحة في قناة السويس',
        description: 'تأخيرات متوقعة بنسبة 20% في شحنات الزيوت المستوردة لمدة 4 أيام.',
        severity: 'high',
        region: 'قناة السويس'
      },
      {
        title: 'موجة جفاف في الدلتا',
        description: 'توقعات بنقص في محصول القمح المحلي، مما قد يرفع أسعار الدقيق بالأسواق صيفاً.',
        severity: 'medium',
        region: 'الدلتا'
      }
    ]
  });

  // 3. Market Trends
  await prisma.marketTrend.deleteMany({});
  await prisma.marketTrend.createMany({
    data: [
      { name: 'سكر أبيض (برازيلي)', symbol: 'SUGAR', price: 28500, change_24h: 1.2, unit: 'Ton' },
      { name: 'زيت دوار الشمس', symbol: 'OIL', price: 62000, change_24h: -0.4, unit: 'Ton' },
      { name: 'قمح روسي (مطحون)', symbol: 'WHEAT', price: 14200, change_24h: 2.5, unit: 'Ton' }
    ]
  });

  console.log('Trade Ecosystem Seed (Phases 5-7) completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
