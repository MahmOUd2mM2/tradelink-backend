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
exports.getSpecializedInsights = void 0;
const SpecializationService_1 = require("../services/SpecializationService");
const getSpecializedInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const [expiring, risks, batches] = yield Promise.all([
            SpecializationService_1.SpecializationService.getExpiringStock(userId),
            SpecializationService_1.SpecializationService.getInventoryRisks(userId),
            SpecializationService_1.SpecializationService.getBatchStatus(userId)
        ]);
        res.status(200).json({
            expiring,
            risks,
            batches,
            sectorAdvice: expiring.length > 10 ? "⚠️ تحذير: قطاع الـ FMCG الخاص بك لديه كميات كبيرة قاربت على الانتهاء. ننصح بعمل 'Bulk Deal' لتصريفها." : "✅ إدارة المخزون مستقرة."
        });
    }
    catch (error) {
        console.error('getSpecializedInsights Error:', error);
        res.status(500).json({ message: 'Error fetching specialized insights' });
    }
});
exports.getSpecializedInsights = getSpecializedInsights;
