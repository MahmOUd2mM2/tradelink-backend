import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { getDistance } from '../utils/geo';

export const createShipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { order_id, company } = req.body;
    if (!order_id) { res.status(400).json({ message: 'order_id is required' }); return; }

    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const shipment = await prisma.shipment.create({
      data: {
        order_id,
        company: company || 'TradeLink Logistics',
        tracking_number: trackingNumber,
        status: 'pending'
      }
    });

    // Update order status to shipped
    await prisma.order.update({ where: { id: order_id }, data: { status: 'shipped' } });

    res.status(201).json({ message: 'Shipment created', shipment });
  } catch (error) {
    console.error('createShipment Error:', error);
    res.status(500).json({ message: 'Server error creating shipment' });
  }
};

export const getShipments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const shipments = await prisma.shipment.findMany({
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
  } catch (error) {
    console.error('getShipments Error:', error);
    res.status(500).json({ message: 'Server error fetching shipments' });
  }
};

export const getShipmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: { include: { buyer: { select: { name: true } }, seller: { select: { name: true } } } }
      }
    });
    if (!shipment) { res.status(404).json({ message: 'Shipment not found' }); return; }
    res.status(200).json(shipment);
  } catch (error) {
    console.error('getShipmentById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateShipment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, tracking_number, company } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (tracking_number) data.tracking_number = tracking_number;
    if (company) data.company = company;
    if (status === 'delivered') data.delivered_at = new Date();

    const shipment = await prisma.shipment.update({ where: { id }, data });

    // If delivered, update order status
    if (status === 'delivered') {
      await prisma.order.update({ where: { id: shipment.order_id }, data: { status: 'delivered' } });
    }

    res.status(200).json({ message: 'Shipment updated', shipment });
  } catch (error) {
    console.error('updateShipment Error:', error);
    res.status(500).json({ message: 'Server error updating shipment' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ message: 'lat and lng are required' });
      return;
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: { current_lat: lat, current_lng: lng } as any,
      include: { order: true }
    }) as any;
    
    const order = (shipment as any).order;
    let geofenceAlert = false;
    let distanceToDestination = null;

    if (order.release_lat && order.release_lng) {
      distanceToDestination = getDistance(lat, lng, order.release_lat, order.release_lng);
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
  } catch (error) {
    console.error('updateLocation Error:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};
