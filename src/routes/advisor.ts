import { Router } from 'express';
import { 
  getCrisisAlerts, 
  getRetentionMetrics, 
  getDebtCollectionStats,
  getInventoryAIInsight,
  getMarketTrends,
  getCoPilotResponse,
  submitReview,
  getSupplierReviews,
  submitQuoteRequest,
  getSupplierAnalytics,
  getCoops,
  getMarketInsights,
  getAlternatives
} from '../controllers/advisor';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/crisis', authenticate, getCrisisAlerts);
router.get('/retention', authenticate, authorizeRoles('Admin', 'Wholesaler'), getRetentionMetrics);
router.get('/debt-collection', authenticate, authorizeRoles('Admin', 'Wholesaler'), getDebtCollectionStats);
router.get('/inventory-insight', authenticate, authorizeRoles('Admin', 'Wholesaler', 'Supplier'), getInventoryAIInsight);
router.get('/market-trends', authenticate, getMarketTrends);
router.post('/copilot', authenticate, getCoPilotResponse);
router.post('/reviews', authenticate, authorizeRoles('Retailer'), submitReview);
router.get('/reviews/supplier/:id', authenticate, getSupplierReviews);

// Sourcing Extensions
router.get('/coops', authenticate, authorizeRoles('Retailer', 'Wholesaler'), getCoops);
router.post('/quotes', authenticate, authorizeRoles('Retailer', 'Wholesaler'), submitQuoteRequest);
router.get('/supplier/:id/analytics', authenticate, getSupplierAnalytics);
router.get('/market-insights', authenticate, getMarketInsights);
router.get('/alternatives/:productId', authenticate, authorizeRoles('Admin', 'Wholesaler', 'Retailer'), getAlternatives);

export default router;
