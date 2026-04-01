"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const copilot_1 = require("../controllers/copilot");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/ask', auth_1.authenticate, copilot_1.askCoPilot);
exports.default = router;
