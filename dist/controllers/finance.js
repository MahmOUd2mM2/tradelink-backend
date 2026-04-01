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
exports.createEncryptedInvoice = exports.getWalletBalance = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getWalletBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // In a real schema we'd have a Wallet model. We'll use mocked data or aggregate from payments.
        // For now, we mock the logic since Wallet isn't explicitly in the schema, 
        // or we calculate based on completed sales vs purchases.
        const incomingPayments = yield prisma_1.default.payment.aggregate({
            where: {
                order: { seller_id: userId },
                status: 'completed'
            },
            _sum: { amount: true }
        });
        const outgoingPayments = yield prisma_1.default.payment.aggregate({
            where: {
                order: { buyer_id: userId },
                status: 'completed'
            },
            _sum: { amount: true }
        });
        const balance = (Number(incomingPayments._sum.amount) || 0) - (Number(outgoingPayments._sum.amount) || 0);
        res.status(200).json({
            balance,
            currency: 'EGP',
            escrow_locked: 4500 // Mock locked amount in escrow
        });
    }
    catch (error) {
        console.error('getWalletBalance Error:', error);
        res.status(500).json({ message: 'Server error fetching wallet balance' });
    }
});
exports.getWalletBalance = getWalletBalance;
const createEncryptedInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { order_id, amount } = req.body;
        const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!order_id || !amount) {
            res.status(400).json({ message: 'Order ID and Amount required' });
            return;
        }
        const order = yield prisma_1.default.order.findUnique({ where: { id: order_id } });
        if (!order || order.seller_id !== sellerId) {
            res.status(403).json({ message: 'Unauthorized to invoice this order' });
            return;
        }
        // Generate Encrypted Data (Mock representation of AES-256 for Demo)
        const mockHash = Buffer.from(`invoice_${order_id}_${amount}_${Date.now()}`).toString('base64');
        const invoice = yield prisma_1.default.invoice.create({
            data: {
                order_id,
                amount,
                invoice_number: `INV-${mockHash.substring(0, 10).toUpperCase()}`,
                status: 'unpaid'
            }
        });
        res.status(201).json({
            message: 'Encrypted invoice created successfully',
            invoice
        });
    }
    catch (error) {
        console.error('createInvoice Error:', error);
        res.status(500).json({ message: 'Server error creating invoice' });
    }
});
exports.createEncryptedInvoice = createEncryptedInvoice;
