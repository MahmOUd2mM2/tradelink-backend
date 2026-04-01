import { Request, Response } from 'express';
import { WarehouseRentalService } from '../services/WarehouseRentalService';
import { AuthRequest } from '../middlewares/auth';

export const getAvailableRentals = async (req: Request, res: Response) => {
  try {
    const list = await WarehouseRentalService.getAvailableSpaces();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rentals' });
  }
};

export const requestRental = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, spaceRequired, days } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const result = await WarehouseRentalService.requestStorage(userId, Number(warehouseId), spaceRequired, days);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
