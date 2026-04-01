"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_1 = require("../controllers/finance");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/wallet', auth_1.authenticate, finance_1.getWalletBalance);
router.post('/invoice', auth_1.authenticate, (0, auth_1.authorizeRoles)('Supplier', 'Wholesaler'), finance_1.createEncryptedInvoice);
exports.default = router;
