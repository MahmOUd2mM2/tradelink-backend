"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const war_room_1 = require("../controllers/war-room");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, war_room_1.getWarRoomStats);
exports.default = router;
