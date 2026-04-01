"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const specialization_1 = require("../controllers/specialization");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/insights', auth_1.authenticate, specialization_1.getSpecializedInsights);
exports.default = router;
