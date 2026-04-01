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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getSuppliers = exports.updateUserStatus = exports.getProfile = exports.getUserById = exports.getUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            include: { role: true },
            orderBy: { created_at: 'desc' }
        });
        const sanitized = users.map((_a) => {
            var { password } = _a, u = __rest(_a, ["password"]);
            return u;
        });
        res.status(200).json(sanitized);
    }
    catch (error) {
        console.error('getUsers Error:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});
exports.getUsers = getUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const user = yield prisma_1.default.user.findUnique({
            where: { id },
            include: {
                role: true,
                products: true,
                warehouses: true,
                orders_bought: { take: 5, orderBy: { created_at: 'desc' } },
                orders_sold: { take: 5, orderBy: { created_at: 'desc' } }
            }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { password } = user, sanitized = __rest(user, ["password"]);
        res.status(200).json(sanitized);
    }
    catch (error) {
        console.error('getUserById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserById = getUserById;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || Number(req.query.userId);
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized or missing userId' });
            return;
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { password } = user, sanitized = __rest(user, ["password"]);
        res.status(200).json(sanitized);
    }
    catch (error) {
        console.error('getProfile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProfile = getProfile;
const updateUserStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }
        const user = yield prisma_1.default.user.update({
            where: { id },
            data: { status }
        });
        const { password } = user, sanitized = __rest(user, ["password"]);
        res.status(200).json({ message: 'User status updated', user: sanitized });
    }
    catch (error) {
        console.error('updateUserStatus Error:', error);
        res.status(500).json({ message: 'Server error updating user status' });
    }
});
exports.updateUserStatus = updateUserStatus;
const getSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const suppliers = yield prisma_1.default.user.findMany({
            where: {
                role: { name: 'Supplier' },
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                company_name: true,
                email: true,
                status: true,
                verified: true
            }
        });
        // Enhance with UI-specific fields (normally these would be in DB)
        const enhanced = suppliers.map(s => (Object.assign(Object.assign({}, s), { country: ['الإمارات', 'تركيا', 'الهند', 'البرازيل', 'الصين'][s.id % 5], rating: (4.5 + (s.id % 5) * 0.1).toFixed(1), category: s.id % 2 === 0 ? 'خامات غذائية' : 'منتجات معبأة' })));
        res.status(200).json(enhanced);
    }
    catch (error) {
        console.error('getSuppliers Error:', error);
        res.status(500).json({ message: 'Error fetching suppliers' });
    }
});
exports.getSuppliers = getSuppliers;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { name, company_name, phone, otpCode } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // 🛡️ Security: Mandatory OTP for Profile Update
        if (!otpCode) {
            res.status(400).json({ message: 'مطلوب رمز التحقق (OTP) لتحديث البيانات' });
            return;
        }
        const otp = yield prisma_1.default.oTP.findFirst({
            where: {
                user_id: userId,
                code: otpCode,
                type: 'UPDATE_PROFILE',
                expires_at: { gt: new Date() }
            }
        });
        if (!otp) {
            res.status(400).json({ message: 'رمز التحقق غير صحيح أو انتهى' });
            return;
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: { name, company_name, phone }
        });
        // Mark as consumed
        yield prisma_1.default.oTP.deleteMany({ where: { user_id: userId, type: 'UPDATE_PROFILE' } });
        const { password } = updatedUser, sanitized = __rest(updatedUser, ["password"]);
        res.status(200).json({ message: 'تم تحديث الملف الشخصي بنجاح', user: sanitized });
    }
    catch (error) {
        console.error('updateProfile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateProfile = updateProfile;
