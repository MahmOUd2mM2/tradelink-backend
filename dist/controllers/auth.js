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
exports.login = exports.register = exports.registerOTP = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const SMSService_1 = require("../services/SMSService");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyfor_tradelink_pro_development';
const registerOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phone } = req.body;
        if (!email || !phone) {
            res.status(400).json({ message: 'البريد الإلكتروني ورقم الهاتف مطلوبان' });
            return;
        }
        const existingUser = yield prisma_1.default.user.findFirst({
            where: { OR: [{ email }, { phone }] }
        });
        if (existingUser) {
            res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل' });
            return;
        }
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        yield prisma_1.default.oTP.create({
            data: {
                code,
                type: 'REGISTRATION',
                expires_at: expiresAt
            }
        });
        // 🛡️ Universal Security: Using SMSService
        const message = `رمز التسجيل الخاص بك في منصة TradeLink Pro هو: ${code}.`;
        yield SMSService_1.SMSService.sendSMS(phone, message);
        res.json({ message: 'تم إرسال رمز التحقق لهاتفك لإكمال التسجيل', success: true, mockCode: code });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'خطأ في إرسال رمز التحقق' });
    }
});
exports.registerOTP = registerOTP;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, roleName, phone, company_name, governorate, city, district, village, hayy, trade_category, latitude, longitude, otpCode } = req.body;
        if (!name || !email || !password || !roleName || !phone || !otpCode) {
            res.status(400).json({ message: 'يرجى ملء جميع الحقول ورمز التحقق' });
            return;
        }
        const otp = yield prisma_1.default.oTP.findFirst({
            where: {
                code: otpCode,
                type: 'REGISTRATION',
                expires_at: { gt: new Date() }
            },
            orderBy: { created_at: 'desc' }
        });
        if (!otp) {
            res.status(400).json({ message: 'رمز التحقق غير صحيح أو انتهت صلاحيته' });
            return;
        }
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل' });
            return;
        }
        const role = yield prisma_1.default.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                company_name,
                governorate,
                city,
                district: district || city, // Using district for Marakiz
                village,
                hayy,
                trade_category,
                latitude: parseFloat(latitude) || null,
                longitude: parseFloat(longitude) || null,
                role_id: role.id,
                phone_verified: true
            },
        });
        yield prisma_1.default.oTP.delete({ where: { id: otp.id } });
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email, role: role.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: role.name,
            },
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, otpCode } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Need email and password' });
            return;
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
            include: { role: true },
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // 🛡️ 2FA Enforcement (Phase 40)
        if (!otpCode) {
            // Automatic trigger for Login OTP if user exists
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            yield prisma_1.default.oTP.create({
                data: { user_id: user.id, code, type: 'LOGIN', expires_at: expiresAt }
            });
            if (user.phone) {
                const message = `رمز التحقق الخاص بك للدخول إلى TradeLink Pro هو: ${code}. لا تشارك هذا الرمز مع أحد.`;
                yield SMSService_1.SMSService.sendSMS(user.phone, message);
            }
            res.status(202).json({
                message: 'مطلوب التحقق الثنائي (2FA). تم إرسال رمز التحقق لهاتفك.',
                requiresOTP: true,
                userId: user.id
            });
            return;
        }
        // Verify OTP
        const otp = yield prisma_1.default.oTP.findFirst({
            where: {
                user_id: user.id,
                code: otpCode,
                type: 'LOGIN',
                expires_at: { gt: new Date() }
            }
        });
        if (!otp) {
            res.status(400).json({ message: 'رمز التحقق الثنائي (2FA) غير صحيح أو انتهى' });
            return;
        }
        // Mark as consumed
        yield prisma_1.default.oTP.deleteMany({ where: { user_id: user.id, type: 'LOGIN' } });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
exports.login = login;
