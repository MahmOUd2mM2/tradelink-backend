"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.get('/', (req, res) => {
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
const auth_1 = __importDefault(require("./routes/auth"));
const product_1 = __importDefault(require("./routes/product"));
const order_1 = __importDefault(require("./routes/order"));
const finance_1 = __importDefault(require("./routes/finance"));
const advisor_1 = __importDefault(require("./routes/advisor"));
const payment_1 = __importDefault(require("./routes/payment"));
const invoice_1 = __importDefault(require("./routes/invoice"));
const shipment_1 = __importDefault(require("./routes/shipment"));
const warehouse_1 = __importDefault(require("./routes/warehouse"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const logistics_1 = __importDefault(require("./routes/logistics"));
const user_1 = __importDefault(require("./routes/user"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const otp_1 = __importDefault(require("./routes/otp"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const war_room_1 = __importDefault(require("./routes/war-room"));
const admin_1 = __importDefault(require("./routes/admin"));
const auction_1 = __importDefault(require("./routes/auction"));
const specialization_1 = __importDefault(require("./routes/specialization"));
const copilot_1 = __importDefault(require("./routes/copilot"));
const warehouse_rental_1 = __importDefault(require("./routes/warehouse-rental"));
const retailer_1 = __importDefault(require("./routes/retailer"));
const storefront_1 = __importDefault(require("./routes/storefront"));
const ecosystem_1 = __importDefault(require("./routes/ecosystem"));
const supplier_discovery_1 = __importDefault(require("./routes/supplier-discovery"));
// Register routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', product_1.default);
app.use('/api/orders', order_1.default);
app.use('/api/finance', finance_1.default);
app.use('/api/advisor', advisor_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/invoices', invoice_1.default);
app.use('/api/shipments', shipment_1.default);
app.use('/api/warehouses', warehouse_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/logistics', logistics_1.default);
app.use('/api/users', user_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/otp', otp_1.default);
app.use('/api/feedback', feedback_1.default);
app.use('/api/war-room', war_room_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/auctions', auction_1.default);
app.use('/api/specialization', specialization_1.default);
app.use('/api/copilot', copilot_1.default);
app.use('/api/warehouse-rental', warehouse_rental_1.default);
app.use('/api/retailer', retailer_1.default);
app.use('/api/storefront', storefront_1.default);
app.use('/api/ecosystem', ecosystem_1.default);
app.use('/api/suppliers', supplier_discovery_1.default);
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ReportingService_1 = require("./services/ReportingService");
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
exports.io = io;
// Real-time Pulse (Phase 27)
io.on('connection', (socket) => {
    console.log(`[socket]: Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[socket]: Client disconnected`));
});
httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
    // Phase 20: BI Automation (Mock Cron)
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        yield ReportingService_1.ReportingService.generateWeeklyPDF();
        yield ReportingService_1.ReportingService.sendHealthEmail();
    }), 24 * 60 * 60 * 1000);
    console.log('[BI] Scheduled automation initialized');
});
