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
exports.WalletService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class WalletService {
    /**
     * Phase 4: Immutable Transaction History
     * Records a wallet movement with a digital signature (Blockchain Simulation)
     */
    static recordTransaction(userId_1, amount_1, type_1) {
        return __awaiter(this, arguments, void 0, function* (userId, amount, type, status = 'COMPLETED') {
            const signature = `TX-${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            return yield prisma_1.default.immutableLog.create({
                data: {
                    entity_type: 'Wallet_Transaction',
                    entity_id: userId,
                    action: type,
                    new_state: JSON.stringify({ amount, status }),
                    signature
                }
            });
        });
    }
    /**
     * Phase 4: Deposit/Withdrawal Management
     * Initiates a request for funding or payout
     */
    static requestMovement(userId, amount, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield prisma_1.default.wallet.findUnique({ where: { user_id: userId } });
            if (!wallet)
                throw new Error('Wallet not found');
            if (type === 'WITHDRAWAL' && Number(wallet.balance) < amount) {
                throw new Error('Insufficient balance for withdrawal');
            }
            // Records the pending movement in the audit log
            const tx = yield this.recordTransaction(userId, amount, type, 'PENDING');
            return {
                transactionId: tx.id,
                message: type === 'DEPOSIT' ? 'تم استلام طلب الإيداع. يرجى إرسال المبلغ عبر فودافون كاش.' : 'تم تسجيل طلب السحب. سيتم التحصيل خلال 24 ساعة.',
                status: 'PENDING'
            };
        });
    }
    /**
     * Approves a pending movement (Admin tool)
     */
    static approveMovement(adminId, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const log = yield prisma_1.default.immutableLog.findUnique({ where: { id: transactionId } });
            if (!log || log.entity_type !== 'Wallet_Transaction')
                throw new Error('Transaction not found');
            const state = JSON.parse(log.new_state || '{}');
            if (state.status !== 'PENDING')
                throw new Error('Transaction already processed');
            const userId = log.entity_id;
            const amount = state.amount;
            const type = log.action;
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Update Wallet
                if (type === 'DEPOSIT') {
                    yield tx.wallet.update({
                        where: { user_id: userId },
                        data: { balance: { increment: amount } }
                    });
                }
                else if (type === 'WITHDRAWAL') {
                    yield tx.wallet.update({
                        where: { user_id: userId },
                        data: { balance: { decrement: amount } }
                    });
                }
                // 2. Finalize Log
                yield tx.immutableLog.update({
                    where: { id: transactionId },
                    data: {
                        new_state: JSON.stringify({ amount, status: 'APPROVED', adminId }),
                        signature: `${log.signature}-APPROVED`
                    }
                });
                return { success: true, message: 'Transaction approved and balance updated' };
            }));
        });
    }
}
exports.WalletService = WalletService;
