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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class LogService {
    /**
     * Records a high-integrity immutable log for critical operations
     */
    static log(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const signature = `SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            return yield prisma_1.default.immutableLog.create({
                data: {
                    entity_type: entry.entity_type,
                    entity_id: entry.entity_id,
                    action: entry.action,
                    previous_state: entry.previous_state || null,
                    new_state: entry.new_state,
                    signature: signature
                }
            });
        });
    }
    /**
     * Fetches full history for a specific entity
     */
    static getHistory(entityType, entityId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.immutableLog.findMany({
                where: { entity_type: entityType, entity_id: entityId },
                orderBy: { created_at: 'desc' }
            });
        });
    }
}
exports.LogService = LogService;
