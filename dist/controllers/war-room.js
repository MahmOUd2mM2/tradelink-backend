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
exports.getWarRoomStats = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const PredictionEngine_1 = require("../services/PredictionEngine");
const CrisisRadarService_1 = require("../services/CrisisRadarService");
const getWarRoomStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Live Trade Pulse
        const recentOrders = yield prisma_1.default.order.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            include: { buyer: { select: { company_name: true } }, seller: { select: { company_name: true } } }
        });
        const activeOrdersCount = yield prisma_1.default.order.count({
            where: { status: { in: ['pending', 'paid', 'shipped'] } }
        });
        // 2. Escrow Volume
        const wallets = yield prisma_1.default.wallet.findMany();
        const totalEscrow = wallets.reduce((acc, w) => acc + Number(w.escrow_balance), 0);
        // 3. Industrial Intel & Security (Phase 26/28)
        const securityScore = yield PredictionEngine_1.PredictionEngine.calculateSecurityScore();
        const marketAlerts = yield PredictionEngine_1.PredictionEngine.getMarketAlerts();
        // 🌐 Phase 24: Global Commodity Index Radar
        const globalTrends = yield CrisisRadarService_1.CrisisRadarService.getGlobalTrends();
        const securityEvents = [
            { id: Date.now(), type: 'DDoS Mitigated (Edge)', time: '02m ago', severity: 'low' },
            { id: Date.now() - 1000, type: 'Unauthorized API Access Blocked', time: '15m ago', severity: 'medium' },
            { id: Date.now() - 2000, type: 'Blockchain Integrity Verified', time: 'Live', severity: 'high' }
        ];
        res.json({
            pulse: {
                recentOrders: recentOrders.map(o => ({
                    id: o.id,
                    buyer: o.buyer.company_name,
                    seller: o.seller.company_name,
                    amount: o.total_amount,
                    status: o.status
                })),
                activeOrdersCount,
                totalEscrow: totalEscrow.toFixed(2)
            },
            security: {
                score: securityScore,
                events: securityEvents
            },
            radar: {
                local: marketAlerts.map(a => (Object.assign(Object.assign({}, a), { isHot: a.severity === 'high' }))),
                global: globalTrends
            },
            heatMap: [
                { city: 'القاهرة', intensity: 0.9, demand: 'High', color: 'red' },
                { city: 'الإسكندرية', intensity: 0.7, demand: 'Medium-High', color: 'orange' },
                { city: 'المنصورة', intensity: 0.85, demand: 'Critical', color: 'red' },
                { city: 'أسيوط', intensity: 0.3, demand: 'Low', color: 'blue' },
                { city: 'سوهاج', intensity: 0.45, demand: 'Stable', color: 'green' }
            ]
        });
    }
    catch (err) {
        console.error('WarRoom Stats Error:', err);
        res.status(500).json({ message: 'Error fetching war room stats' });
    }
});
exports.getWarRoomStats = getWarRoomStats;
