"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const warehouse_rental_1 = require("../controllers/warehouse-rental");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/listings', auth_1.authenticate, warehouse_rental_1.getAvailableRentals);
router.post('/request', auth_1.authenticate, warehouse_rental_1.requestRental);
exports.default = router;
