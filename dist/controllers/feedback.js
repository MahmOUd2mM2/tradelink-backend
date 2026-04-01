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
exports.resolveFeedback = exports.getAdminFeedbacks = exports.submitFeedback = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const submitFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, subject, message } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!type || !subject || !message) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const feedback = yield prisma_1.default.feedback.create({
            data: {
                user_id: Number(userId),
                type,
                subject,
                message,
                status: 'open'
            }
        });
        res.status(201).json({ message: 'شكراً لمشاركتنا رأيك! تم تسجيل طلبك بنجاح.', feedback });
    }
    catch (error) {
        console.error('submitFeedback Error:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء إرسال الملاحظات' });
    }
});
exports.submitFeedback = submitFeedback;
const getAdminFeedbacks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Basic admin check (could be more robust with a middleware)
        const user = yield prisma_1.default.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId } });
        if (!(user === null || user === void 0 ? void 0 : user.is_admin)) {
            res.status(403).json({ message: 'غير مصرح لك بالدخول لهذه الصفحة' });
            return;
        }
        const feedbacks = yield prisma_1.default.feedback.findMany({
            include: { user: { select: { name: true, company_name: true, phone: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json(feedbacks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching feedbacks' });
    }
});
exports.getAdminFeedbacks = getAdminFeedbacks;
const resolveFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const user = yield prisma_1.default.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId } });
        if (!(user === null || user === void 0 ? void 0 : user.is_admin)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        yield prisma_1.default.feedback.update({
            where: { id: Number(id) },
            data: { status: 'resolved' }
        });
        res.status(200).json({ message: 'تم تحديث حالة الطلب كمنتهي' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});
exports.resolveFeedback = resolveFeedback;
