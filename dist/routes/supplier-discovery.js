"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_discovery_1 = require("../controllers/supplier-discovery");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/alternatives', auth_1.authenticate, supplier_discovery_1.getAlternativeSuppliers);
exports.default = router;
