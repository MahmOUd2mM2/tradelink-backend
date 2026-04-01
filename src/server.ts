import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TradeLink Pro API is running',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      invoices: '/api/invoices',
      shipments: '/api/shipments',
      warehouses: '/api/warehouses',
      inventory: '/api/inventory',
      users: '/api/users',
      finance: '/api/finance',
      advisor: '/api/advisor',
      dashboard: '/api/dashboard'
    }
  });
});

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import orderRoutes from './routes/order';
import financeRoutes from './routes/finance';
import advisorRoutes from './routes/advisor';
import paymentRoutes from './routes/payment';
import invoiceRoutes from './routes/invoice';
import shipmentRoutes from './routes/shipment';
import warehouseRoutes from './routes/warehouse';
import inventoryRoutes from './routes/inventory';
import logisticsRoutes from './routes/logistics';
import userRoutes from './routes/user';
import dashboardRoutes from './routes/dashboard';
import walletRoutes from './routes/wallet';
import otpRoutes from './routes/otp';
import feedbackRoutes from './routes/feedback';
import warRoomRoutes from './routes/war-room';
import adminRoutes from './routes/admin';
import auctionRoutes from './routes/auction';
import specializationRoutes from './routes/specialization';
import supplierDiscoveryRoutes from './routes/supplier-discovery';
import ecosystemBridgeRoutes from './routes/ecosystem-bridge';

import copilotRoutes from './routes/copilot';
import warehouseRentalRoutes from './routes/warehouse-rental';
import retailerRoutes from './routes/retailer';
import storefrontRoutes from './routes/storefront';
import ecosystemRoutes from './routes/ecosystem';
import pluginRoutes from './routes/plugin';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/war-room', warRoomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/specialization', specializationRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/warehouse-rental', warehouseRentalRoutes);
app.use('/api/retailer', retailerRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/ecosystem', ecosystemRoutes);
app.use('/api/suppliers', supplierDiscoveryRoutes);
app.use('/api/ecosystem-bridge', ecosystemBridgeRoutes);
app.use('/api/plugins', pluginRoutes);

import { createServer } from 'http';
import { Server } from 'socket.io';
import { ReportingService } from './services/ReportingService';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Real-time Pulse (Phase 27)
io.on('connection', (socket) => {
  console.log(`[socket]: Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket]: Client disconnected`));
});

// Export io to use in controllers
export { io };

httpServer.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
  
  // Phase 20: BI Automation (Mock Cron)
  setInterval(async () => {
    await ReportingService.generateWeeklyPDF();
    await ReportingService.sendHealthEmail();
  }, 24 * 60 * 60 * 1000); 

  console.log('[BI] Scheduled automation initialized');
});
