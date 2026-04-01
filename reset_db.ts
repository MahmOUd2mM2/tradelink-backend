import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('--- STARTING COMPREHENSIVE DATABASE RESET ---');
  try {
    // Phase 1: Clear deep child tables
    console.log('Clearing Transactional Data...');
    await prisma.oTP.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.quoteRequest.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.bid.deleteMany({});
    await prisma.retentionMetric.deleteMany({});

    // Phase 2: Clear secondary child tables
    console.log('Clearing Core Entity Data...');
    await prisma.inventory.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.auction.deleteMany({});
    await prisma.discountRule.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.wallet.deleteMany({});

    // Phase 3: Clear Users (except admin)
    console.log('Clearing Users...');
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'admin@tradelink.com'
        }
      }
    });

    console.log('\n--- DATABASE RESET SUCCESSFUL ---');
    console.log('The database has been fully cleared (except for the admin account).');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
