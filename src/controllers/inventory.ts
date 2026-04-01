import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';
import { OCRService } from '../services/OCRService';

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const inventory = await prisma.inventory.findMany({
      where: role === 'Admin' ? {} : { warehouse: { owner_id: userId } },
      include: {
        product: { select: { name: true, sku: true, price: true } },
        warehouse: { select: { city: true, address: true } }
      }
    });
    res.status(200).json(inventory);
  } catch (error) {
    console.error('getInventory Error:', error);
    res.status(500).json({ message: 'Server error fetching inventory' });
  }
};

export const addInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product_id, warehouse_id, quantity } = req.body;
    if (!product_id || !warehouse_id || quantity === undefined) {
      res.status(400).json({ message: 'product_id, warehouse_id, and quantity are required' }); return;
    }

    const existing = await prisma.inventory.findFirst({
      where: { product_id, warehouse_id }
    });

    let inventory;
    if (existing) {
      inventory = await prisma.inventory.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity }
      });
    } else {
      inventory = await prisma.inventory.create({
        data: { product_id, warehouse_id, quantity }
      });
    }
    res.status(200).json({ message: 'Inventory updated', inventory });
  } catch (error) {
    console.error('addInventory Error:', error);
    res.status(500).json({ message: 'Server error updating inventory' });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { quantity } = req.body;
    if (quantity === undefined) { res.status(400).json({ message: 'quantity is required' }); return; }

    const inventory = await prisma.inventory.update({
      where: { id },
      data: { quantity }
    });
    res.status(200).json({ message: 'Stock adjusted', inventory });
  } catch (error) {
    console.error('adjustStock Error:', error);
    res.status(500).json({ message: 'Server error adjusting stock' });
  }
};

export const simulateOCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await OCRService.simulateGoogleVision("mock-image-url");
    res.status(200).json(result);
  } catch (error) {
    console.error('simulateOCR Error:', error);
    res.status(500).json({ message: 'Error processing OCR scan' });
  }
};

export const confirmOCR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { warehouse_id, items } = req.body;

    if (!userId || !warehouse_id || !items) {
      res.status(400).json({ message: 'userId, warehouse_id, and items are required' });
      return;
    }

    const results = await OCRService.syncToInventory(userId, warehouse_id, items);
    res.status(200).json({ message: 'Inventory updated from OCR', results });
  } catch (error) {
    console.error('confirmOCR Error:', error);
    res.status(500).json({ message: 'Error confirming OCR results' });
  }
};
