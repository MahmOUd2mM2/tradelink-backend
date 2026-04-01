import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.update({
    where: { email: 'mahmoudothman22903@gmail.com' },
    data: { phone: '01006513814' }
  });
  console.log('User phone updated to:', user.phone);
}
main().finally(() => prisma.$disconnect());
