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
exports.updatePaymentStatus = exports.getPaymentById = exports.getPayments = exports.createPayment = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { order_id, method, amount } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!order_id || !method || !amount) {
            res.status(400).json({ message: 'Missing required fields (order_id, method, amount)' });
            return;
        }
        const order = yield prisma_1.default.order.findUnique({ where: { id: order_id } });
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        const txRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const payment = yield prisma_1.default.payment.create({
            data: { order_id, method, amount, status: 'pending', transaction_ref: txRef }
        });
        res.status(201).json({ message: 'Payment created', payment });
    }
    catch (error) {
        console.error('createPayment Error:', error);
        res.status(500).json({ message: 'Server error creating payment' });
    }
});
exports.createPayment = createPayment;
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const payments = yield prisma_1.default.payment.findMany({
            where: role === 'Admin' ? {} : {
                order: {
                    OR: [{ buyer_id: userId }, { seller_id: userId }]
                }
            },
            include: {
                order: {
                    select: { id: true, status: true, buyer: { select: { name: true } }, seller: { select: { name: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error('getPayments Error:', error);
        res.status(500).json({ message: 'Server error fetching payments' });
    }
});
exports.getPayments = getPayments;
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const payment = yield prisma_1.default.payment.findUnique({
            where: { id },
            include: { order: { include: { buyer: { select: { name: true } }, seller: { select: { name: true } } } } }
        });
        if (!payment) {
            res.status(404).json({ message: 'Payment not found' });
            return;
        }
        res.status(200).json(payment);
    }
    catch (error) {
        console.error('getPaymentById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPaymentById = getPaymentById;
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }
        const payment = yield prisma_1.default.payment.update({
            where: { id },
            data: { status }
        });
        // If payment is completed, update order status to paid
        if (status === 'completed') {
            yield prisma_1.default.order.update({ where: { id: payment.order_id }, data: { status: 'paid' } });
        }
        res.status(200).json({ message: 'Payment status updated', payment });
    }
    catch (error) {
        console.error('updatePaymentStatus Error:', error);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
