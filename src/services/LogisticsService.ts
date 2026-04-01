import prisma from '../prisma';

export class LogisticsService {
  /**
   * Calculates the distance between two points in km (Haversine formula)
   */
  static getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Updates shipment location and checks for geofencing triggers
   */
  static async updateTracking(shipmentId: number, lat: number, lng: number) {
    const shipment = await prisma.shipment.update({
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
        
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { status: 'near_destination' }
        });

        // 🛡️ Immutable Audit Trail (Blockchain Simulation)
        await prisma.immutableLog.create({
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
  }

  /**
   * Phase 3: IoT Sensor Simulation
   * Provides real-time telemetry for Pharma/FMCG compliance
   */
  static async getIoTSensorData(shipmentId: number) {
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
      await prisma.immutableLog.create({
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
  }

  /**
   * Phase 3: Smart Routing (TSP Logic)
   * Calculates optimized sequence for multiple delivery points
   */
  static async getSmartRoute(startWarehouseId: number, deliveryPoints: Array<{ lat: number, lng: number, id: number }>) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: startWarehouseId } }) as any;
    if (!warehouse || !warehouse.latitude || !warehouse.longitude) throw new Error('Warehouse not found or missing coordinates');

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
      optimizedSequence.push({ ...nextPoint, distanceToNext: minDistance });
      currentLat = nextPoint.lat;
      currentLng = nextPoint.lng;
    }

    return {
      start: { lat: (warehouse as any).latitude, lng: (warehouse as any).longitude },
      path: optimizedSequence,
      totalEstDistance: optimizedSequence.reduce((acc, p) => acc + p.distanceToNext, 0).toFixed(2) + ' km'
    };
  }

  /**
   * Phase 5: Backhaul Optimization (Eco-Efficiency)
   * Identifies return trips that can be used to transport goods/returns
   * to avoid empty trucks and reduce costs.
   */
  static async getBackhaulOpportunities(currentLocation: { lat: number, lng: number }, maxRadiusKm: number = 20) {
    const shipments = await prisma.shipment.findMany({
      where: {
        status: 'pending'
      },
      include: { order: { include: { seller: true, warehouse: true } as any } } as any
    });

    const opportunities = (shipments as any[]).filter(s => {
      const order = s.order;
      if (!order?.warehouse?.latitude || !order?.warehouse?.longitude) return false;
      const d = this.getDistance(currentLocation.lat, currentLocation.lng, order.warehouse.latitude, order.warehouse.longitude);
      return d <= maxRadiusKm;
    });

    return opportunities.map(o => {
      const distance = this.getDistance(currentLocation.lat, currentLocation.lng, (o as any).order.warehouse.latitude, (o as any).order.warehouse.longitude);
      
      // Industrial Sustainability Calculation: ~0.8kg CO2 per km for heavy trucks
      const co2Saved = (distance * 0.82).toFixed(1);

      return {
        id: (o as any).id,
        tracking: (o as any).tracking_number,
        pickup: (o as any).order.warehouse?.address,
        estimatedSavings: '45%',
        co2Saved: `${co2Saved}kg`,
        type: 'BACKHAUL_PICKUP',
        insight: `🌱 كفاءة بيئية: تحميل هذه الشحنة سيوفر ${co2Saved} كجم من انبعاثات الكربون و45% من تكلفة الوقود.`
      };
    });
  }

  /**
   * Phase 7: Market-Aware Routing
   * Adjusts route weights based on "Market Pulse" and local crisis alerts
   */
  static async getMarketAwareRoute(startWarehouseId: number, deliveryPoints: Array<{ lat: number, lng: number, id: number }>) {
    const baseRoute = await this.getSmartRoute(startWarehouseId, deliveryPoints);
    
    // Simulate fetching regional risks from CrisisRadar/ImmutableLog
    const regionalRisks = [
      { city: 'القاهرة', riskLevel: 'low', delayFactor: 1.0 },
      { city: 'الإسكندرية', riskLevel: 'medium', delayFactor: 1.2 }, // e.g. Port congestion
      { city: 'أسيوط', riskLevel: 'high', delayFactor: 1.5 } // e.g. Sudden price protest or logistics block
    ];

    const marketAdjustedPath = baseRoute.path.map(p => {
      // For now, we mock the city lookup via lat/lng or hardcoded matching
      const risk = regionalRisks[Math.floor(Math.random() * regionalRisks.length)];
      return {
        ...p,
        risk: risk.riskLevel,
        estDelay: `${((risk.delayFactor - 1) * 100).toFixed(0)}%`,
        adjustedTravelTime: `معدل: ${(p.distanceToNext * 2 * risk.delayFactor).toFixed(1)} دقيقة`
      };
    });

    return {
      ...baseRoute,
      path: marketAdjustedPath,
      marketInsight: "تم تعديل المسارات بناءً على حالة السوق والازدحام في الموانئ الرئيسية."
    };
  }
}
