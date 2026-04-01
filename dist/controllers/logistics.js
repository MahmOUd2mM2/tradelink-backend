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
exports.getSmartRoute = exports.getIoTSensorData = exports.updateTracking = void 0;
const LogisticsService_1 = require("../services/LogisticsService");
const updateTracking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { shipment_id, lat, lng } = req.body;
        if (!shipment_id || lat === undefined || lng === undefined) {
            res.status(400).json({ message: 'shipment_id, lat, and lng are required' });
            return;
        }
        const result = yield LogisticsService_1.LogisticsService.updateTracking(shipment_id, lat, lng);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('updateTracking Error:', error);
        res.status(500).json({ message: 'Error updating tracking data' });
    }
});
exports.updateTracking = updateTracking;
const getIoTSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shipment_id = parseInt(req.params.id);
        const data = yield LogisticsService_1.LogisticsService.getIoTSensorData(shipment_id);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'IoT Sensor error' });
    }
});
exports.getIoTSensorData = getIoTSensorData;
const getSmartRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startWarehouseId, points } = req.body;
        const route = yield LogisticsService_1.LogisticsService.getSmartRoute(Number(startWarehouseId), points);
        res.json(route);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getSmartRoute = getSmartRoute;
