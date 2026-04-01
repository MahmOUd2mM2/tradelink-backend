"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_1 = require("../controllers/dashboard");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, dashboard_1.getDashboardStats);
exports.default = router;
