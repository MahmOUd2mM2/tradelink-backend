import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // 1. Reassign the number to the current user
  const user = await prisma.user.update({
    where: { email: 'mahmoudothman22903@gmail.com' },
    data: { phone: '01006513814' }
  });
  console.log('User phone updated to verified number:', user.phone);
}
main().finally(() => prisma.$disconnect());
