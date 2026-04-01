"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const feedback_1 = require("../controllers/feedback");
const router = express_1.default.Router();
router.post('/', auth_1.authenticate, feedback_1.submitFeedback);
router.get('/admin', auth_1.authenticate, feedback_1.getAdminFeedbacks);
router.patch('/:id/resolve', auth_1.authenticate, feedback_1.resolveFeedback);
exports.default = router;
