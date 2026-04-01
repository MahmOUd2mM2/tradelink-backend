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
exports.requestRental = exports.getAvailableRentals = void 0;
const WarehouseRentalService_1 = require("../services/WarehouseRentalService");
const getAvailableRentals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const list = yield WarehouseRentalService_1.WarehouseRentalService.getAvailableSpaces();
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching rentals' });
    }
});
exports.getAvailableRentals = getAvailableRentals;
const requestRental = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { warehouseId, spaceRequired, days } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = yield WarehouseRentalService_1.WarehouseRentalService.requestStorage(userId, Number(warehouseId), spaceRequired, days);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.requestRental = requestRental;
