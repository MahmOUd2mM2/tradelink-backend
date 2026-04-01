"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storefront_1 = require("../controllers/storefront");
const router = (0, express_1.Router)();
router.get('/nearby', storefront_1.getNearbyRetailers);
router.post('/checkout', storefront_1.placeB2COrder);
exports.default = router;
