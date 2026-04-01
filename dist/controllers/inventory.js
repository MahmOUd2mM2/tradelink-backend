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
exports.confirmOCR = exports.simulateOCR = exports.adjustStock = exports.addInventory = exports.getInventory = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const OCRService_1 = require("../services/OCRService");
const getInventory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const inventory = yield prisma_1.default.inventory.findMany({
            where: role === 'Admin' ? {} : { warehouse: { owner_id: userId } },
            include: {
                product: { select: { name: true, sku: true, price: true } },
                warehouse: { select: { city: true, address: true } }
            }
        });
        res.status(200).json(inventory);
    }
    catch (error) {
        console.error('getInventory Error:', error);
        res.status(500).json({ message: 'Server error fetching inventory' });
    }
});
exports.getInventory = getInventory;
const addInventory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { product_id, warehouse_id, quantity } = req.body;
        if (!product_id || !warehouse_id || quantity === undefined) {
            res.status(400).json({ message: 'product_id, warehouse_id, and quantity are required' });
            return;
        }
        const existing = yield prisma_1.default.inventory.findFirst({
            where: { product_id, warehouse_id }
        });
        let inventory;
        if (existing) {
            inventory = yield prisma_1.default.inventory.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity }
            });
        }
        else {
            inventory = yield prisma_1.default.inventory.create({
                data: { product_id, warehouse_id, quantity }
            });
        }
        res.status(200).json({ message: 'Inventory updated', inventory });
    }
    catch (error) {
        console.error('addInventory Error:', error);
        res.status(500).json({ message: 'Server error updating inventory' });
    }
});
exports.addInventory = addInventory;
const adjustStock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { quantity } = req.body;
        if (quantity === undefined) {
            res.status(400).json({ message: 'quantity is required' });
            return;
        }
        const inventory = yield prisma_1.default.inventory.update({
            where: { id },
            data: { quantity }
        });
        res.status(200).json({ message: 'Stock adjusted', inventory });
    }
    catch (error) {
        console.error('adjustStock Error:', error);
        res.status(500).json({ message: 'Server error adjusting stock' });
    }
});
exports.adjustStock = adjustStock;
const simulateOCR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield OCRService_1.OCRService.simulateGoogleVision("mock-image-url");
        res.status(200).json(result);
    }
    catch (error) {
        console.error('simulateOCR Error:', error);
        res.status(500).json({ message: 'Error processing OCR scan' });
    }
});
exports.simulateOCR = simulateOCR;
const confirmOCR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { warehouse_id, items } = req.body;
        if (!userId || !warehouse_id || !items) {
            res.status(400).json({ message: 'userId, warehouse_id, and items are required' });
            return;
        }
        const results = yield OCRService_1.OCRService.syncToInventory(userId, warehouse_id, items);
        res.status(200).json({ message: 'Inventory updated from OCR', results });
    }
    catch (error) {
        console.error('confirmOCR Error:', error);
        res.status(500).json({ message: 'Error confirming OCR results' });
    }
});
exports.confirmOCR = confirmOCR;
