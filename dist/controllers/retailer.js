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
exports.submitInvoiceToTax = exports.getMerchantBadge = exports.syncPOSSale = void 0;
const RetailerService_1 = require("../services/RetailerService");
const TaxService_1 = require("../services/TaxService");
const syncPOSSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const retailerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { warehouseId, items } = req.body;
        if (!retailerId || !warehouseId || !items) {
            res.status(400).json({ message: 'Missing POS data' });
            return;
        }
        const results = yield RetailerService_1.RetailerService.recordPOSSale(retailerId, Number(warehouseId), items);
        // 🇪🇬 Phase 16: Automatically submit to ETA if over a certain threshold (optional)
        // res.status(200).json({ message: 'POS Sale Synced', results });
        res.json({ message: 'تم مزامنة مبيعات الكاشير بنجاح وتحديث المخزون', results });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.syncPOSSale = syncPOSSale;
const getMerchantBadge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const merchantId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || Number(req.params.id);
        const rep = yield RetailerService_1.RetailerService.getMerchantReputation(merchantId);
        res.json(rep);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching reputation' });
    }
});
exports.getMerchantBadge = getMerchantBadge;
const submitInvoiceToTax = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceId } = req.params;
        const result = yield TaxService_1.TaxService.submitToETA(Number(invoiceId));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Tax Portal error' });
    }
});
exports.submitInvoiceToTax = submitInvoiceToTax;
