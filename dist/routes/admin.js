"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../controllers/admin");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, admin_1.getAdminStats);
router.post('/feedback/:id/resolve', auth_1.authenticate, admin_1.resolveFeedback);
exports.default = router;
