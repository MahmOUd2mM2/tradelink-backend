
export class SMSService {
  private static readonly ACCOUNT_SID = process.env.SMS_ACCOUNT_SID;
  private static readonly AUTH_TOKEN = process.env.SMS_AUTH_TOKEN;
  private static readonly FROM_NUMBER = process.env.SMS_FROM_NUMBER;

  /**
   * Sends a real SMS via Twilio API
   * @param to Phone number in international format (e.g., +201234567890)
   * @param body Message content
   */
  static async sendSMS(to: string, body: string): Promise<boolean> {
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

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.ACCOUNT_SID}:${this.AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        console.error(`[SMS-ERROR] Twilio Error for ${formattedTo}:`, errorData.message || response.statusText);
        return false;
      }

      console.log(`[SMS-LIVE] Successfully sent SMS to ${formattedTo}. SID: ${this.ACCOUNT_SID}`);
      return true;
    } catch (error) {
      console.error('[SMS-ERROR] Exception in SMSService:', error);
      return false;
    }
  }

  /**
   * Sends an OTP specific message
   */
  static async sendOTP(to: string, code: string): Promise<boolean> {
    const body = `رمز التحقق الخاص بك في منصة TradeLink Pro هو: ${code}. لا تشارك هذا الرمز مع أحد لدواعي الأمان.`;
    return this.sendSMS(to, body);
  }
}
