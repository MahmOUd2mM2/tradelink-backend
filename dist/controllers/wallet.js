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
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveWalletAction = exports.requestDepositWithdrawal = exports.payInvoice = exports.withdraw = exports.deposit = exports.getWallet = void 0;
const client_1 = require("@prisma/client");
const WalletService_1 = require("../services/WalletService");
const prisma = new client_1.PrismaClient();
const getWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        let wallet = yield prisma.wallet.findUnique({
            where: { user_id: Number(userId) },
            include: {
                transactions: {
                    orderBy: { created_at: 'desc' },
                    take: 10
                }
            }
        });
        // Auto-create wallet if it doesn't exist
        if (!wallet) {
            wallet = yield prisma.wallet.create({
                data: {
                    user_id: Number(userId),
                    balance: 0,
                    currency: 'EGP'
                },
                include: {
                    transactions: true
                }
            });
        }
        res.json(wallet);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getWallet = getWallet;
const deposit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, amount, channel, reference } = req.body;
        const wallet = yield prisma.wallet.update({
            where: { user_id: Number(userId) },
            data: {
                balance: { increment: amount },
                transactions: {
                    create: {
                        type: 'DEPOSIT',
                        amount: amount,
                        status: 'completed',
                        channel: channel || 'InstaPay',
                        reference: reference || `DEP-${Date.now()}`,
                        description: `Deposit via ${channel || 'InstaPay'}`
                    }
                }
            },
            include: { transactions: true }
        });
        res.json(wallet);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.deposit = deposit;
const withdraw = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, amount, channel, otpCode } = req.body;
        // 1. Mandatory OTP Verification for Withdrawal
        const otp = yield prisma.oTP.findFirst({
            where: {
                user_id: Number(userId),
                code: otpCode,
                type: 'WITHDRAW',
                expires_at: { gt: new Date() }
            }
        });
        if (!otp) {
            return res.status(400).json({ error: 'رمز التحقق (OTP) غير صحيح أو انتهى' });
        }
        // Phase 35: Biometric Authorization (Mock)
        const { biometricToken } = req.body;
        if (amount > 10000 && !biometricToken) {
            return res.status(403).json({
                error: 'يتطلب هذا المبلغ تصديقاً بيومترياً (FaceID/TouchID)',
                requiresBiometric: true
            });
        }
        const wallet = yield prisma.wallet.findUnique({
            where: { user_id: Number(userId) }
        });
        if (!wallet || Number(wallet.balance) < amount) {
            return res.status(400).json({ error: 'رصيد غير كافٍ' });
        }
        const updatedWallet = yield prisma.wallet.update({
            where: { user_id: Number(userId) },
            data: {
                balance: { decrement: amount },
                transactions: {
                    create: {
                        type: 'WITHDRAW',
                        amount: amount,
                        status: 'completed',
                        channel: channel || 'Vodafone Cash',
                        reference: `WTH-${Date.now()}`,
                        description: `Withdrawal to ${channel || 'Digital Wallet'}`
                    }
                }
            },
            include: { transactions: true }
        });
        // Clean up OTP after successful withdrawal
        yield prisma.oTP.deleteMany({ where: { user_id: Number(userId), type: 'WITHDRAW' } });
        res.json(updatedWallet);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.withdraw = withdraw;
const payInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, invoiceId, otpCode } = req.body;
        if (!otpCode) {
            return res.status(400).json({ error: 'مطلوب رمز التحقق (OTP) لإتمام عملية الدفع' });
        }
        // 🛡️ Security: Enforce OTP for all payments
        const otp = yield prisma.oTP.findFirst({
            where: {
                user_id: Number(userId),
                code: otpCode,
                type: 'PAYMENT',
                expires_at: { gt: new Date() }
            }
        });
        if (!otp) {
            return res.status(400).json({ error: 'رمز التحقق (OTP) غير صحيح أو انتهى. الرجاء طلب رمز جديد.' });
        }
        const invoice = yield prisma.invoice.findUnique({
            where: { id: Number(invoiceId) },
            include: { order: true }
        });
        if (!invoice || invoice.status === 'paid') {
            return res.status(400).json({ error: 'Invalid or already paid invoice' });
        }
        const wallet = yield prisma.wallet.findUnique({
            where: { user_id: Number(userId) }
        });
        if (!wallet || Number(wallet.balance) < Number(invoice.amount)) {
            return res.status(400).json({ error: 'Insufficient balance in TradeLink Cash' });
        }
        // Phase 35: Biometric Authorization (Mock)
        const { biometricToken } = req.body;
        if (Number(invoice.amount) > 50000 && !biometricToken) {
            return res.status(403).json({
                error: 'عملية دفع كبيرة! مطلوب التحقق البيومتري للأمان',
                requiresBiometric: true
            });
        }
        // Consumed the OTP
        yield prisma.oTP.deleteMany({ where: { user_id: Number(userId), type: 'PAYMENT' } });
        const sellerId = invoice.order.seller_id;
        // Ensure seller has a wallet
        yield prisma.wallet.upsert({
            where: { user_id: sellerId },
            update: {},
            create: { user_id: sellerId, balance: 0, escrow_balance: 0 }
        });
        // Atomic transaction: Pay invoice and move to escrow
        const result = yield prisma.$transaction([
            // Deduct from buyer
            prisma.wallet.update({
                where: { user_id: Number(userId) },
                data: {
                    balance: { decrement: invoice.amount },
                    transactions: {
                        create: {
                            type: 'PAYMENT',
                            amount: invoice.amount,
                            status: 'completed',
                            reference: `INV-PAY-${invoice.invoice_number}`,
                            description: `Payment for Invoice ${invoice.invoice_number} (Safe Escrow)`
                        }
                    }
                }
            }),
            // Move to seller's escrow
            prisma.wallet.update({
                where: { user_id: sellerId },
                data: {
                    escrow_balance: { increment: invoice.amount },
                    transactions: {
                        create: {
                            type: 'DEPOSIT', // Using DEPOSIT as a placeholder or we could add 'ESCROW' type
                            amount: invoice.amount,
                            status: 'pending',
                            reference: `ESC-IN-${invoice.invoice_number}`,
                            description: `Escrow funds for Invoice ${invoice.invoice_number}`
                        }
                    }
                }
            }),
            prisma.invoice.update({
                where: { id: Number(invoiceId) },
                data: { status: 'paid' }
            }),
            prisma.order.update({
                where: { id: invoice.order_id },
                data: { status: 'paid' }
            })
        ]);
        res.json({ message: 'Payment successful (Held in Escrow)', wallet: result[0], invoice: result[2] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.payInvoice = payInvoice;
const requestDepositWithdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, amount, type } = req.body;
        const result = yield WalletService_1.WalletService.requestMovement(Number(userId), Number(amount), type);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.requestDepositWithdrawal = requestDepositWithdrawal;
const approveWalletAction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transactionId, adminId } = req.body;
        const result = yield WalletService_1.WalletService.approveMovement(Number(adminId), Number(transactionId));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.approveWalletAction = approveWalletAction;
