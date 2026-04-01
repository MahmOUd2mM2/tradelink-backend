import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // 1. Move the existing phone to a placeholder (if it exists)
  const existing = await prisma.user.findUnique({ where: { phone: '01286508713' } });
  if (existing) {
     await prisma.user.update({
      where: { phone: '01286508713' },
      data: { phone: '01011111111' } // generic placeholder
    });
  }

  // 2. Set the desired phone to the current user
  const user = await prisma.user.update({
    where: { email: 'mahmoudothman22903@gmail.com' },
    data: { phone: '01286508713' }
  });
  console.log('User phone updated to:', user.phone);
}
main().finally(() => prisma.$disconnect());
