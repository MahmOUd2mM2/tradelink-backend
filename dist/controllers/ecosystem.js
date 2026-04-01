"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = exports.getIntegrations = void 0;
const PluginMetaService_1 = require("../services/PluginMetaService");
const getIntegrations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const list = yield PluginMetaService_1.PluginMetaService.getActiveIntegrations(userId);
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: 'Ecosystem error' });
    }
});
exports.getIntegrations = getIntegrations;
const generateApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { label } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const keyData = yield PluginMetaService_1.PluginMetaService.generateEcosystemKey(userId, label || 'Default Key');
        res.json(keyData);
    }
    catch (error) {
        res.status(500).json({ message: 'Key generation error' });
    }
});
exports.generateApiKey = generateApiKey;
