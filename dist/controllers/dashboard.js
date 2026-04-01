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
exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        // Total counts
        const [totalUsers, totalProducts, totalOrders, totalPayments] = yield Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.product.count(),
            prisma_1.default.order.count(),
            prisma_1.default.payment.count()
        ]);
        // Revenue (completed payments)
        const revenue = yield prisma_1.default.payment.aggregate({
            where: { status: 'completed' },
            _sum: { amount: true }
        });
        // Orders by status
        const [pendingOrders, paidOrders, shippedOrders, deliveredOrders] = yield Promise.all([
            prisma_1.default.order.count({ where: { status: 'pending' } }),
            prisma_1.default.order.count({ where: { status: 'paid' } }),
            prisma_1.default.order.count({ where: { status: 'shipped' } }),
            prisma_1.default.order.count({ where: { status: 'delivered' } }),
        ]);
        // Unpaid invoices
        const unpaidInvoices = yield prisma_1.default.invoice.aggregate({
            where: { status: 'unpaid' },
            _sum: { amount: true },
            _count: true
        });
        // Recent orders
        const recentOrders = yield prisma_1.default.order.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: {
                buyer: { select: { name: true, company_name: true } },
                seller: { select: { name: true, company_name: true } }
            }
        });
        res.status(200).json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalPayments,
            revenue: Number(revenue._sum.amount) || 0,
            ordersByStatus: { pending: pendingOrders, paid: paidOrders, shipped: shippedOrders, delivered: deliveredOrders },
            unpaidInvoices: { count: unpaidInvoices._count, total: Number(unpaidInvoices._sum.amount) || 0 },
            recentOrders,
            currency: 'EGP'
        });
    }
    catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
});
exports.getDashboardStats = getDashboardStats;
