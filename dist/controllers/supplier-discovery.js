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
exports.getAlternativeSuppliers = void 0;
const AlternativeSupplierEngine_1 = require("../services/AlternativeSupplierEngine");
const getAlternativeSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId, currentSupplierId } = req.query;
        if (!productId || !currentSupplierId) {
            res.status(400).json({ message: 'productId and currentSupplierId are required' });
            return;
        }
        const suggestions = yield AlternativeSupplierEngine_1.AlternativeSupplierEngine.findAlternatives(Number(productId), Number(currentSupplierId));
        res.json(suggestions);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
});
exports.getAlternativeSuppliers = getAlternativeSuppliers;
