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
exports.updateInvoiceStatus = exports.getInvoiceById = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const invoices = yield prisma_1.default.invoice.findMany({
            where: role === 'Admin' ? {} : {
                order: {
                    OR: [{ buyer_id: userId }, { seller_id: userId }]
                }
            },
            include: {
                order: {
                    select: { id: true, status: true, total_amount: true, buyer: { select: { name: true, company_name: true } }, seller: { select: { name: true, company_name: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        console.error('getInvoices Error:', error);
        res.status(500).json({ message: 'Server error fetching invoices' });
    }
});
exports.getInvoices = getInvoices;
const getInvoiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const invoice = yield prisma_1.default.invoice.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: { include: { product: true } },
                        buyer: { select: { name: true, company_name: true, email: true } },
                        seller: { select: { name: true, company_name: true, email: true } }
                    }
                }
            }
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        res.status(200).json(invoice);
    }
    catch (error) {
        console.error('getInvoiceById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getInvoiceById = getInvoiceById;
const updateInvoiceStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Status is required' });
            return;
        }
        const invoice = yield prisma_1.default.invoice.update({
            where: { id },
            data: { status }
        });
        res.status(200).json({ message: 'Invoice status updated', invoice });
    }
    catch (error) {
        console.error('updateInvoiceStatus Error:', error);
        res.status(500).json({ message: 'Server error updating invoice status' });
    }
});
exports.updateInvoiceStatus = updateInvoiceStatus;
