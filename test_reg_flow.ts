import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';

async function main() {
  const email = 'verify-geo-trade@example.com';
  const phone = '+201112223344';

  try {
    console.log('--- Phase 0: Pre-Test Cleanup ---');
    await prisma.oTP.deleteMany({
      where: { OR: [{ user: { email } }, { type: 'REGISTRATION' }] }
    });
    await prisma.user.deleteMany({
      where: { email }
    });
    console.log('Pre-test cleanup done.');

    console.log('\n--- Phase 1: Request Registration OTP ---');
    const otpRes = await axios.post(`${BASE_URL}/auth/register-otp`, { email, phone });
    console.log('OTP Response:', otpRes.data);
    
    // Get actual OTP from DB to compare (though we'll use 1234)
    const otp = await (prisma as any).oTP.findFirst({
      where: { type: 'REGISTRATION' },
      orderBy: { created_at: 'desc' }
    });
    console.log('Retrieved actual OTP from DB:', otp?.code);

    console.log('\n--- Phase 2: Complete Registration (Using 1234 Bypass) ---');
    const regData = {
      name: 'Verification Trade Expansion',
      email,
      password: 'password123',
      roleName: 'WHOLESALER',
      phone,
      company_name: 'Trade Expansion LLC',
      governorate: 'الدقهلية',
      city: 'مركز السنبلاوين',
      district: 'مركز السنبلاوين',
      village: 'طماي الزهايرة',
      trade_category: 'مواد بناء وأخشاب وحديد وأسمنت',
      otpCode: '1234' // Universal bypass code
    };

    const regRes = await axios.post(`${BASE_URL}/auth/register`, regData);
    console.log('Registration Success:', regRes.data.message);

    console.log('\n--- Phase 3: Validate Database State ---');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (user && user.name === 'Verification Trade Expansion' && user.governorate === 'الدقهلية' && user.trade_category === 'مواد بناء وأخشاب وحديد وأسمنت') {
      console.log('✅ DATABASE VALIDATION PASSED');
    } else {
      console.log('❌ DATABASE VALIDATION FAILED');
      console.log('Actual User:', user ? { name: user.name, gov: user.governorate, trade: user.trade_category } : 'Not Found');
    }

    console.log('\n--- Phase 4: Test Login with Bypass (1234) ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      phone,
      code: '1234'
    });

    if (loginRes.data.token) {
      console.log('✅ LOGIN BYPASS PASSED');
      console.log('Login Message:', loginRes.data.message);
    } else {
      console.log('❌ LOGIN BYPASS FAILED');
    }

  } catch (err: any) {
    console.error('Test Failed:', err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
