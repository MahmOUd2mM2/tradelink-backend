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
exports.placeB2COrder = exports.getNearbyRetailers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getNearbyRetailers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng } = req.query;
        // B2C: List retailers for consumer app
        const retailers = yield prisma_1.default.user.findMany({
            where: { role: { name: 'Retailer' }, status: 'active' },
            select: { id: true, name: true, company_name: true, phone: true, latitude: true, longitude: true }
        });
        res.json(retailers);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching storefronts' });
    }
});
exports.getNearbyRetailers = getNearbyRetailers;
const placeB2COrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { consumerName, phone, retailerId, items } = req.body;
        // Phase 5: One-click consumer buy
        res.json({
            message: 'تم استلام طلبك! المندوب سيتواصل معك في أقرب وقت.',
            orderRef: `B2C-${Date.now()}`
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Checkout error' });
    }
});
exports.placeB2COrder = placeB2COrder;
