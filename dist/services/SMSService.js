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
exports.SMSService = void 0;
class SMSService {
    /**
     * Sends a real SMS via Twilio API
     * @param to Phone number in international format (e.g., +201234567890)
     * @param body Message content
     */
    static sendSMS(to, body) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.ACCOUNT_SID || !this.AUTH_TOKEN) {
                console.warn(`[SMS-MOCK] Missing Twilio credentials. Mocking send to ${to}: ${body}`);
                return true; // Simulate success for development
            }
            try {
                const formattedTo = to.startsWith('+') ? to : `+2${to}`; // Default to Egypt code if missing
                const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.ACCOUNT_SID}/Messages.json`;
                const params = new URLSearchParams();
                params.append('To', formattedTo);
                params.append('From', this.FROM_NUMBER || 'TradeLink');
                params.append('Body', body);
                const response = yield fetch(twilioUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(`${this.ACCOUNT_SID}:${this.AUTH_TOKEN}`).toString('base64'),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params
                });
                if (!response.ok) {
                    const errorData = yield response.json();
                    console.error('[SMS-ERROR] Twilio Error:', errorData.message || response.statusText);
                    return false;
                }
                console.log(`[SMS-LIVE] Successfully sent SMS to ${formattedTo}`);
                return true;
            }
            catch (error) {
                console.error('[SMS-ERROR] Exception in SMSService:', error);
                return false;
            }
        });
    }
    /**
     * Sends an OTP specific message
     */
    static sendOTP(to, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = `رمز التحقق الخاص بك في منصة TradeLink Pro هو: ${code}. لا تشارك هذا الرمز مع أحد لدواعي الأمان.`;
            return this.sendSMS(to, body);
        });
    }
}
exports.SMSService = SMSService;
SMSService.ACCOUNT_SID = process.env.SMS_ACCOUNT_SID;
SMSService.AUTH_TOKEN = process.env.SMS_AUTH_TOKEN;
SMSService.FROM_NUMBER = process.env.SMS_FROM_NUMBER;
