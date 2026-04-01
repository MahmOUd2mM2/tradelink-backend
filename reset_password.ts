import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await bcrypt.hash('TradeLink123!', 10);
  const user = await prisma.user.update({
    where: { email: 'mahmoudothman22903@gmail.com' },
    data: { password: hashedPassword }
  });
  console.log('Password reset successfully for:', user.email);
}
main().finally(() => prisma.$disconnect());
