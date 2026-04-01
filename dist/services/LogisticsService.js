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
exports.LogisticsService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class LogisticsService {
    /**
     * Calculates the distance between two points in km (Haversine formula)
     */
    static getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * Updates shipment location and checks for geofencing triggers
     */
    static updateTracking(shipmentId, lat, lng) {
        return __awaiter(this, void 0, void 0, function* () {
            const shipment = yield prisma_1.default.shipment.update({
                where: { id: shipmentId },
                data: { current_lat: lat, current_lng: lng },
                include: { order: { include: { buyer: true } } }
            });
            const buyer = shipment.order.buyer;
            let geofenceAlert = null;
            if (buyer.latitude && buyer.longitude) {
                const distance = this.getDistance(lat, lng, buyer.latitude, buyer.longitude);
                // Industrial Precision: Trigger alert if within 5km (for truck logistics)
                if (distance < 5 && shipment.status !== 'near_destination') {
                    geofenceAlert = `🚨 تنبيه لوجستي (TradeLink Precision): الشحنة رقم ${shipment.tracking_number} على بعد ${distance.toFixed(1)} كم من موقع الاستلام!`;
                    yield prisma_1.default.shipment.update({
                        where: { id: shipmentId },
                        data: { status: 'near_destination' }
                    });
                    // 🛡️ Immutable Audit Trail (Blockchain Simulation)
                    yield prisma_1.default.immutableLog.create({
                        data: {
                            entity_type: 'Shipment',
                            entity_id: shipmentId,
                            action: 'GEOFENCE_TRIGGERED',
                            new_state: JSON.stringify({ distance: `${distance.toFixed(2)}km`, lat, lng }),
                            signature: `LOG-prec-${Date.now()}`
                        }
                    });
                }
            }
            return { shipment, geofenceAlert };
        });
    }
    /**
     * Phase 3: IoT Sensor Simulation
     * Provides real-time telemetry for Pharma/FMCG compliance
     */
    static getIoTSensorData(shipmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulated IoT readings
            const temperature = 4 + (Math.random() * 2); // 4-6°C for cold chain
            const weight = 500 + (Math.random() * 50); // scales simulation
            const battery = 85 - (Math.random() * 10);
            const sensorReport = {
                shipmentId,
                timestamp: new Date().toISOString(),
                sensors: [
                    { type: 'Temperature', value: `${temperature.toFixed(1)}°C`, status: temperature > 8 ? 'CRITICAL' : 'OK' },
                    { type: 'Digital Scale', value: `${weight.toFixed(2)}kg`, status: 'STABLE' },
                    { type: 'Humidity', value: '45%', status: 'OK' },
                    { type: 'Battery', value: `${battery.toFixed(0)}%`, status: 'OK' }
                ]
            };
            // Log critical anomalies to ImmutableLog
            if (temperature > 8) {
                yield prisma_1.default.immutableLog.create({
                    data: {
                        entity_type: 'Shipment_IoT',
                        entity_id: shipmentId,
                        action: 'TEMP_EXCEEDED',
                        new_state: JSON.stringify(sensorReport),
                        signature: `IOT-WARN-${Date.now()}`
                    }
                });
            }
            return sensorReport;
        });
    }
    /**
     * Phase 3: Smart Routing (TSP Logic)
     * Calculates optimized sequence for multiple delivery points
     */
    static getSmartRoute(startWarehouseId, deliveryPoints) {
        return __awaiter(this, void 0, void 0, function* () {
            const warehouse = yield prisma_1.default.warehouse.findUnique({ where: { id: startWarehouseId } });
            if (!warehouse || !warehouse.latitude || !warehouse.longitude)
                throw new Error('Warehouse not found or missing coordinates');
            // Simple nearest-neighbor sorting for TSP simulation
            let currentLat = warehouse.latitude;
            let currentLng = warehouse.longitude;
            const optimizedSequence = [];
            const remainingPoints = [...deliveryPoints];
            while (remainingPoints.length > 0) {
                let nearestIndex = 0;
                let minDistance = Infinity;
                for (let i = 0; i < remainingPoints.length; i++) {
                    const d = this.getDistance(currentLat, currentLng, remainingPoints[i].lat, remainingPoints[i].lng);
                    if (d < minDistance) {
                        minDistance = d;
                        nearestIndex = i;
                    }
                }
                const nextPoint = remainingPoints.splice(nearestIndex, 1)[0];
                optimizedSequence.push(Object.assign(Object.assign({}, nextPoint), { distanceToNext: minDistance }));
                currentLat = nextPoint.lat;
                currentLng = nextPoint.lng;
            }
            return {
                start: { lat: warehouse.latitude, lng: warehouse.longitude },
                path: optimizedSequence,
                totalEstDistance: optimizedSequence.reduce((acc, p) => acc + p.distanceToNext, 0).toFixed(2) + ' km'
            };
        });
    }
}
exports.LogisticsService = LogisticsService;
