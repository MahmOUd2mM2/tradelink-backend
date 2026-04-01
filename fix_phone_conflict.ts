import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // 1. Move the existing phone to a placeholder
  await prisma.user.update({
    where: { phone: '01006513814' },
    data: { phone: '01000000000' }
  });
  // 2. Set the desired phone to the current user
  const user = await prisma.user.update({
    where: { email: 'mahmoudothman22903@gmail.com' },
    data: { phone: '01006513814' }
  });
  console.log('User phone updated to:', user.phone);
}
main().finally(() => prisma.$disconnect());
