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
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.createProduct = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma_1.default.product.findMany({
            include: {
                supplier: {
                    select: { name: true, company_name: true }
                },
                inventory: true
            }
        });
        const productsWithStock = products.map(p => (Object.assign(Object.assign({}, p), { stock: p.inventory.reduce((acc, inv) => acc + inv.quantity, 0) })));
        res.status(200).json(productsWithStock);
    }
    catch (error) {
        console.error('getProducts Error:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});
exports.getProducts = getProducts;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { name, sku, price, min_order_qty } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'Supplier') {
            res.status(403).json({ message: 'Only suppliers can create products' });
            return;
        }
        if (!name || !sku || !price) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const newProduct = yield prisma_1.default.product.create({
            data: {
                supplier_id: userId,
                name,
                sku,
                price,
                min_order_qty: min_order_qty || 1,
            }
        });
        res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('createProduct Error:', error);
        res.status(500).json({ message: 'Server error creating product' });
    }
});
exports.createProduct = createProduct;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const product = yield prisma_1.default.product.findUnique({
            where: { id },
            include: {
                supplier: { select: { name: true, company_name: true } },
                inventory: { include: { warehouse: { select: { city: true, address: true } } } }
            }
        });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        res.status(200).json(product);
    }
    catch (error) {
        console.error('getProductById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProductById = getProductById;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { name, price, min_order_qty, status } = req.body;
        const data = {};
        if (name)
            data.name = name;
        if (price !== undefined)
            data.price = price;
        if (min_order_qty !== undefined)
            data.min_order_qty = min_order_qty;
        if (status)
            data.status = status;
        const product = yield prisma_1.default.product.update({ where: { id }, data });
        res.status(200).json({ message: 'Product updated', product });
    }
    catch (error) {
        console.error('updateProduct Error:', error);
        res.status(500).json({ message: 'Server error updating product' });
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        yield prisma_1.default.product.delete({ where: { id } });
        res.status(200).json({ message: 'Product deleted' });
    }
    catch (error) {
        console.error('deleteProduct Error:', error);
        res.status(500).json({ message: 'Server error deleting product' });
    }
});
exports.deleteProduct = deleteProduct;
