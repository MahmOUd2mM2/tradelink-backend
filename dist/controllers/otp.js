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
exports.verifyOTP = exports.sendOTP = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const SMSService_1 = require("../services/SMSService");
const sendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, type } = req.body;
        if (!userId)
            return res.status(400).json({ error: 'User ID required' });
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        yield prisma_1.default.oTP.create({
            data: {
                user_id: Number(userId),
                code,
                type: type || 'VERIFY_PHONE',
                expires_at: expiresAt
            }
        });
        const typeLabels = {
            'VERIFY_PHONE': 'لتأكيد رقم هاتفك',
            'WITHDRAW': 'لعملية سحب نقدي',
            'PAYMENT': 'لإتمام عملية الدفع (Escrow)',
            'CREATE_ORDER': 'لتأكيد طلب شراء جديد',
            'UPDATE_PROFILE': 'لتعديل بياناتك الحساسة'
        };
        const label = typeLabels[type] || 'لتأمين حسابك';
        const message = `رمز التحقق الخاص بك في TradeLink Pro هو: ${code}. استخدمه ${label}. لا تشارك هذا الرمز مع أحد.`;
        const user = yield prisma_1.default.user.findUnique({ where: { id: Number(userId) } });
        const phone = user === null || user === void 0 ? void 0 : user.phone;
        if (phone) {
            yield SMSService_1.SMSService.sendSMS(phone, message);
        }
        else {
            console.log(`[OTP-MOCK] No phone found for User ${userId}. Mock Code: ${code} for ${type}`);
        }
        res.json({ message: 'تم إرسال رمز التحقق بنجاح', code });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.sendOTP = sendOTP;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, code, type } = req.body;
        const otp = yield prisma_1.default.oTP.findFirst({
            where: {
                user_id: Number(userId),
                code,
                type: type || 'VERIFY_PHONE',
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });
        if (!otp) {
            return res.status(400).json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته' });
        }
        if (type === 'VERIFY_PHONE') {
            yield prisma_1.default.user.update({
                where: { id: Number(userId) },
                data: { phone_verified: true }
            });
        }
        yield prisma_1.default.oTP.deleteMany({ where: { user_id: Number(userId), type: type || 'VERIFY_PHONE' } });
        res.json({ success: true, message: 'تم التحقق بنجاح' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.verifyOTP = verifyOTP;
