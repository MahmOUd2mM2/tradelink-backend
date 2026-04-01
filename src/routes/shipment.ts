import { Router } from 'express';
import { createShipment, getShipments, getShipmentById, updateShipment, updateLocation } from '../controllers/shipment';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createShipment);
router.get('/', authenticate, getShipments);
router.get('/:id', authenticate, getShipmentById);
router.patch('/:id', authenticate, updateShipment);
router.post('/:id/location', authenticate, updateLocation);

export default router;
