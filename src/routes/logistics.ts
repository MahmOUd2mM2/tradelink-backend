import { Router } from 'express';
import { updateTracking, getIoTSensorData, getSmartRoute, getLatestShipment, getMarketAwareRoute } from '../controllers/logistics';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/latest', authenticate, getLatestShipment);
router.post('/tracking', authenticate, authorizeRoles('Admin', 'Supplier', 'Wholesaler'), updateTracking);
router.get('/iot/:id', authenticate, authorizeRoles('Admin', 'Supplier', 'Wholesaler'), getIoTSensorData);
router.post('/smart-route', authenticate, authorizeRoles('Admin', 'Supplier', 'Wholesaler'), getSmartRoute);
router.post('/market-aware-route', authenticate, authorizeRoles('Admin', 'Supplier', 'Wholesaler'), getMarketAwareRoute);

export default router;
