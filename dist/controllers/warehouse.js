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
exports.deleteWarehouse = exports.updateWarehouse = exports.getWarehouseById = exports.getWarehouses = exports.createWarehouse = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createWarehouse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { city, address, capacity } = req.body;
        if (!city || !address) {
            res.status(400).json({ message: 'city and address are required' });
            return;
        }
        const warehouse = yield prisma_1.default.warehouse.create({
            data: { owner_id: userId, city, address, capacity: capacity || null }
        });
        res.status(201).json({ message: 'Warehouse created', warehouse });
    }
    catch (error) {
        console.error('createWarehouse Error:', error);
        res.status(500).json({ message: 'Server error creating warehouse' });
    }
});
exports.createWarehouse = createWarehouse;
const getWarehouses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const warehouses = yield prisma_1.default.warehouse.findMany({
            where: role === 'Admin' ? {} : { owner_id: userId },
            include: {
                owner: { select: { name: true, company_name: true } },
                inventory: { include: { product: { select: { name: true, sku: true } } } }
            }
        });
        res.status(200).json(warehouses);
    }
    catch (error) {
        console.error('getWarehouses Error:', error);
        res.status(500).json({ message: 'Server error fetching warehouses' });
    }
});
exports.getWarehouses = getWarehouses;
const getWarehouseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const warehouse = yield prisma_1.default.warehouse.findUnique({
            where: { id },
            include: {
                owner: { select: { name: true, company_name: true } },
                inventory: { include: { product: true } }
            }
        });
        if (!warehouse) {
            res.status(404).json({ message: 'Warehouse not found' });
            return;
        }
        res.status(200).json(warehouse);
    }
    catch (error) {
        console.error('getWarehouseById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getWarehouseById = getWarehouseById;
const updateWarehouse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { city, address, capacity } = req.body;
        const data = {};
        if (city)
            data.city = city;
        if (address)
            data.address = address;
        if (capacity !== undefined)
            data.capacity = capacity;
        const warehouse = yield prisma_1.default.warehouse.update({ where: { id }, data });
        res.status(200).json({ message: 'Warehouse updated', warehouse });
    }
    catch (error) {
        console.error('updateWarehouse Error:', error);
        res.status(500).json({ message: 'Server error updating warehouse' });
    }
});
exports.updateWarehouse = updateWarehouse;
const deleteWarehouse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield prisma_1.default.warehouse.delete({ where: { id } });
        res.status(200).json({ message: 'Warehouse deleted' });
    }
    catch (error) {
        console.error('deleteWarehouse Error:', error);
        res.status(500).json({ message: 'Server error deleting warehouse' });
    }
});
exports.deleteWarehouse = deleteWarehouse;
