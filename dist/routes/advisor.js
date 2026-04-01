"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const advisor_1 = require("../controllers/advisor");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/crisis', auth_1.authenticate, advisor_1.getCrisisAlerts);
router.get('/retention', auth_1.authenticate, advisor_1.getRetentionMetrics);
router.get('/debt-collection', auth_1.authenticate, advisor_1.getDebtCollectionStats);
router.get('/inventory-insight', auth_1.authenticate, advisor_1.getInventoryAIInsight);
router.get('/market-trends', auth_1.authenticate, advisor_1.getMarketTrends);
router.post('/copilot', auth_1.authenticate, advisor_1.getCoPilotResponse);
router.post('/reviews', auth_1.authenticate, advisor_1.submitReview);
router.get('/reviews/supplier/:id', auth_1.authenticate, advisor_1.getSupplierReviews);
// Sourcing Extensions
router.post('/quotes', auth_1.authenticate, advisor_1.submitQuoteRequest);
router.get('/supplier/:id/analytics', auth_1.authenticate, advisor_1.getSupplierAnalytics);
exports.default = router;
