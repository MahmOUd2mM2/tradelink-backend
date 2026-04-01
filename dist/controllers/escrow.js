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
exports.verifyFulfillment = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const FinancialService_1 = require("../services/FinancialService");
const verifyFulfillment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { releaseCode, lat, lng } = req.body;
        const order = yield prisma_1.default.order.findUnique({
            where: { id: Number(id) },
            include: { buyer: true, seller: true }
        });
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        // verification logic
        let verified = true;
        const failures = [];
        // 1. Check if the release code is a valid OTP for this order/user
        const otpVerification = yield prisma_1.default.oTP.findFirst({
            where: {
                user_id: order.buyer_id,
                code: releaseCode,
                type: 'RELEASE_ESCROW',
                expires_at: { gt: new Date() }
            }
        });
        if (!otpVerification && order.release_code !== releaseCode) {
            verified = false;
            failures.push('رمز التحقق/الاستلام غير صحيح أو انتهت صلاحيته');
        }
        if (order.release_lat && order.release_lng && lat && lng) {
            const distance = Math.sqrt(Math.pow(order.release_lat - lat, 2) + Math.pow(order.release_lng - lng, 2));
            const threshold = 0.005; // Approx 500m
            if (distance > threshold) {
                verified = false;
                failures.push('الموقع الجغرافي خارج نطاق المستودع المحدد');
            }
        }
        if (!verified) {
            res.status(400).json({ message: 'فشل توثيق الاستلام', reasons: failures });
            return;
        }
        // Success: Update Order & Trigger Instant Clearing
        yield prisma_1.default.order.update({
            where: { id: Number(id) },
            data: {
                release_status: 'verified',
                status: 'delivered'
            }
        });
        // 💰 Phase 102: Instant Clearing (TradeLink Cash Integration)
        const clearingSuccess = yield FinancialService_1.FinancialService.releaseEscrow(Number(id));
        res.status(200).json({
            message: clearingSuccess
                ? 'تم التوثيق بنجاح! تم تحرير أموال الضمان للمورد فوراً.'
                : 'تم التوثيق بنجاح! جاري معالجة تحويل الأموال تلقائياً.'
        });
    }
    catch (err) {
        console.error('verifyFulfillment Error:', err);
        res.status(500).json({ message: 'Error verifying fulfillment' });
    }
});
exports.verifyFulfillment = verifyFulfillment;
