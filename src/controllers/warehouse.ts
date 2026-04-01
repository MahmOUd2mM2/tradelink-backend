import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const createWarehouse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { city, address, capacity } = req.body;
    if (!city || !address) { res.status(400).json({ message: 'city and address are required' }); return; }

    const warehouse = await prisma.warehouse.create({
      data: { owner_id: userId, city, address, capacity: capacity || null }
    });
    res.status(201).json({ message: 'Warehouse created', warehouse });
  } catch (error) {
    console.error('createWarehouse Error:', error);
    res.status(500).json({ message: 'Server error creating warehouse' });
  }
};

export const getWarehouses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const warehouses = await prisma.warehouse.findMany({
      where: role === 'Admin' ? {} : { owner_id: userId },
      include: {
        owner: { select: { name: true, company_name: true } },
        inventory: { include: { product: { select: { name: true, sku: true } } } }
      }
    });
    res.status(200).json(warehouses);
  } catch (error) {
    console.error('getWarehouses Error:', error);
    res.status(500).json({ message: 'Server error fetching warehouses' });
  }
};

export const getWarehouseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true, company_name: true } },
        inventory: { include: { product: true } }
      }
    });
    if (!warehouse) { res.status(404).json({ message: 'Warehouse not found' }); return; }
    res.status(200).json(warehouse);
  } catch (error) {
    console.error('getWarehouseById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWarehouse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { city, address, capacity } = req.body;
    const data: any = {};
    if (city) data.city = city;
    if (address) data.address = address;
    if (capacity !== undefined) data.capacity = capacity;

    const warehouse = await prisma.warehouse.update({ where: { id }, data });
    res.status(200).json({ message: 'Warehouse updated', warehouse });
  } catch (error) {
    console.error('updateWarehouse Error:', error);
    res.status(500).json({ message: 'Server error updating warehouse' });
  }
};

export const deleteWarehouse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.warehouse.delete({ where: { id } });
    res.status(200).json({ message: 'Warehouse deleted' });
  } catch (error) {
    console.error('deleteWarehouse Error:', error);
    res.status(500).json({ message: 'Server error deleting warehouse' });
  }
};
