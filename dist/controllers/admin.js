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
exports.resolveFeedback = exports.getAdminStats = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAdminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'Admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const [users, products, orders, feedback] = yield Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.product.count(),
            prisma_1.default.order.count(),
            prisma_1.default.feedback.count()
        ]);
        const recentLogs = yield prisma_1.default.immutableLog.findMany({
            take: 10,
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({
            stats: { users, products, orders, feedback },
            logs: recentLogs
        });
    }
    catch (error) {
        console.error('getAdminStats Error:', error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});
exports.getAdminStats = getAdminStats;
const resolveFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield prisma_1.default.feedback.update({
            where: { id },
            data: { status: 'resolved' }
        });
        res.status(200).json({ message: 'Feedback resolved' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error resolving feedback' });
    }
});
exports.resolveFeedback = resolveFeedback;
