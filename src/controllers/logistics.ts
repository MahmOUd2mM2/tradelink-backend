import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { LogisticsService } from '../services/LogisticsService';
import prisma from '../prisma';

export const getLatestShipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    // Find latest shipment where the user is either buyer or seller
    const shipment = await prisma.shipment.findFirst({
      where: {
        order: {
          OR: [
            { buyer_id: userId },
            { seller_id: userId }
          ]
        },
        status: { in: ['pending', 'shipped', 'in_transit', 'near_destination'] }
      },
      orderBy: { id: 'desc' },
      include: {
        order: {
          include: {
            buyer: { select: { name: true, company_name: true, latitude: true, longitude: true } },
            seller: { select: { name: true, company_name: true } }
          }
        }
      }
    });

    if (!shipment) {
      res.status(404).json({ message: 'No active shipments found' });
      return;
    }

    res.json(shipment);
  } catch (error) {
    console.error('getLatestShipment Error:', error);
    res.status(500).json({ message: 'Error fetching latest shipment' });
  }
};

export const updateTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shipment_id, lat, lng } = req.body;
    if (!shipment_id || lat === undefined || lng === undefined) {
      res.status(400).json({ message: 'shipment_id, lat, and lng are required' });
      return;
    }

    const result = await LogisticsService.updateTracking(shipment_id, lat, lng);
    res.status(200).json(result);
  } catch (error) {
    console.error('updateTracking Error:', error);
    res.status(500).json({ message: 'Error updating tracking data' });
  }
};

export const getIoTSensorData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shipment_id = parseInt(req.params.id as string);
    const data = await LogisticsService.getIoTSensorData(shipment_id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'IoT Sensor error' });
  }
};

export const getSmartRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startWarehouseId, points } = req.body;
    const route = await LogisticsService.getSmartRoute(Number(startWarehouseId), points);
    res.json(route);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMarketAwareRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startWarehouseId, points } = req.body;
    if (!startWarehouseId || !points) {
      res.status(400).json({ message: 'Missing startWarehouseId or points' });
      return;
    }
    const route = await LogisticsService.getMarketAwareRoute(Number(startWarehouseId), points);
    res.json(route);
  } catch (error: any) {
    console.error('getMarketAwareRoute Error:', error);
    res.status(400).json({ message: error.message });
  }
};
