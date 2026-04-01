"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ecosystem_1 = require("../controllers/ecosystem");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/plugins', auth_1.authenticate, ecosystem_1.getIntegrations);
router.post('/keys/generate', auth_1.authenticate, ecosystem_1.generateApiKey);
exports.default = router;
