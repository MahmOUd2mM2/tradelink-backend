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
exports.awardAuction = exports.getAuctions = exports.placeBid = exports.createAuction = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createAuction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, product_name, quantity, target_price, expiry_at } = req.body;
        const buyer_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!buyer_id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const auction = yield prisma_1.default.auction.create({
            data: {
                buyer_id,
                title,
                description,
                product_name,
                quantity,
                target_price,
                expiry_at: new Date(expiry_at),
                status: 'open'
            }
        });
        res.status(201).json({ message: 'Auction created', auction });
    }
    catch (err) {
        console.error('createAuction Error:', err);
        res.status(500).json({ message: 'Error creating auction' });
    }
});
exports.createAuction = createAuction;
const placeBid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { auction_id, price, delivery_days, notes } = req.body;
        const supplier_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!supplier_id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const auction = yield prisma_1.default.auction.findUnique({ where: { id: auction_id } });
        if (!auction || auction.status !== 'open') {
            res.status(400).json({ message: 'Auction not found or closed' });
            return;
        }
        const bid = yield prisma_1.default.bid.create({
            data: {
                auction_id,
                supplier_id,
                price,
                delivery_days,
                notes,
                status: 'pending'
            }
        });
        res.status(201).json({ message: 'Bid placed', bid });
    }
    catch (err) {
        console.error('placeBid Error:', err);
        res.status(500).json({ message: 'Error placing bid' });
    }
});
exports.placeBid = placeBid;
const getAuctions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const auctions = yield prisma_1.default.auction.findMany({
            where: { status: 'open' },
            include: { buyer: { select: { company_name: true } }, _count: { select: { bids: true } } }
        });
        res.json(auctions);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching auctions' });
    }
});
exports.getAuctions = getAuctions;
const awardAuction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { auction_id, bid_id } = req.body;
        const buyer_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!buyer_id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const auction = yield prisma_1.default.auction.findUnique({
            where: { id: Number(auction_id) },
        });
        if (!auction || auction.buyer_id !== buyer_id) {
            res.status(403).json({ message: 'Forbidden or auction not found' });
            return;
        }
        // Atomic transaction for awarding
        yield prisma_1.default.$transaction([
            // 1. Close Auction
            prisma_1.default.auction.update({
                where: { id: Number(auction_id) },
                data: { status: 'closed' }
            }),
            // 2. Accept Winning Bid
            prisma_1.default.bid.update({
                where: { id: Number(bid_id) },
                data: { status: 'accepted' }
            }),
            // 3. Reject others
            prisma_1.default.bid.updateMany({
                where: { auction_id: Number(auction_id), id: { not: Number(bid_id) } },
                data: { status: 'rejected' }
            })
        ]);
        res.json({ message: 'Auction awarded successfully' });
    }
    catch (err) {
        console.error('awardAuction Error:', err);
        res.status(500).json({ message: 'Error awarding auction' });
    }
});
exports.awardAuction = awardAuction;
