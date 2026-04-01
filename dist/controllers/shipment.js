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
exports.updateLocation = exports.updateShipment = exports.getShipmentById = exports.getShipments = exports.createShipment = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const geo_1 = require("../utils/geo");
const createShipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, company } = req.body;
        if (!order_id) {
            res.status(400).json({ message: 'order_id is required' });
            return;
        }
        const order = yield prisma_1.default.order.findUnique({ where: { id: order_id } });
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const shipment = yield prisma_1.default.shipment.create({
            data: {
                order_id,
                company: company || 'TradeLink Logistics',
                tracking_number: trackingNumber,
                status: 'pending'
            }
        });
        // Update order status to shipped
        yield prisma_1.default.order.update({ where: { id: order_id }, data: { status: 'shipped' } });
        res.status(201).json({ message: 'Shipment created', shipment });
    }
    catch (error) {
        console.error('createShipment Error:', error);
        res.status(500).json({ message: 'Server error creating shipment' });
    }
});
exports.createShipment = createShipment;
const getShipments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const shipments = yield prisma_1.default.shipment.findMany({
            where: role === 'Admin' ? {} : {
                order: {
                    OR: [{ buyer_id: userId }, { seller_id: userId }]
                }
            },
            include: {
                order: {
                    select: { id: true, status: true, buyer: { select: { name: true } }, seller: { select: { name: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.status(200).json(shipments);
    }
    catch (error) {
        console.error('getShipments Error:', error);
        res.status(500).json({ message: 'Server error fetching shipments' });
    }
});
exports.getShipments = getShipments;
const getShipmentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const shipment = yield prisma_1.default.shipment.findUnique({
            where: { id },
            include: {
                order: { include: { buyer: { select: { name: true } }, seller: { select: { name: true } } } }
            }
        });
        if (!shipment) {
            res.status(404).json({ message: 'Shipment not found' });
            return;
        }
        res.status(200).json(shipment);
    }
    catch (error) {
        console.error('getShipmentById Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getShipmentById = getShipmentById;
const updateShipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { status, tracking_number, company } = req.body;
        const data = {};
        if (status)
            data.status = status;
        if (tracking_number)
            data.tracking_number = tracking_number;
        if (company)
            data.company = company;
        if (status === 'delivered')
            data.delivered_at = new Date();
        const shipment = yield prisma_1.default.shipment.update({ where: { id }, data });
        // If delivered, update order status
        if (status === 'delivered') {
            yield prisma_1.default.order.update({ where: { id: shipment.order_id }, data: { status: 'delivered' } });
        }
        res.status(200).json({ message: 'Shipment updated', shipment });
    }
    catch (error) {
        console.error('updateShipment Error:', error);
        res.status(500).json({ message: 'Server error updating shipment' });
    }
});
exports.updateShipment = updateShipment;
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { lat, lng } = req.body;
        if (lat === undefined || lng === undefined) {
            res.status(400).json({ message: 'lat and lng are required' });
            return;
        }
        const shipment = yield prisma_1.default.shipment.update({
            where: { id },
            data: { current_lat: lat, current_lng: lng },
            include: { order: true }
        });
        const order = shipment.order;
        let geofenceAlert = false;
        let distanceToDestination = null;
        if (order.release_lat && order.release_lng) {
            distanceToDestination = (0, geo_1.getDistance)(lat, lng, order.release_lat, order.release_lng);
            if (distanceToDestination <= 5) {
                geofenceAlert = true;
                // Mock notification
                console.log(`[Geofence] Shipment ${shipment.id} within 5km of dest: ${distanceToDestination.toFixed(2)}km`);
            }
        }
        res.status(200).json({
            message: 'Location updated',
            shipment,
            geofenceAlert,
            distanceToDestination
        });
    }
    catch (error) {
        console.error('updateLocation Error:', error);
        res.status(500).json({ message: 'Error updating location' });
    }
});
exports.updateLocation = updateLocation;
