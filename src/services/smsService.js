const axios = require("axios");

/**
 * SMS Service for WebOTP Verification (MSG91 / DLT Gateway Integration)
 */
async function sendWebOTP(phoneNumber, otpCode) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  console.log(`📱 Sending WebOTP ${otpCode} to ${phoneNumber}...`);

  // If SMS Auth Key is provided, call real MSG91 SMS Gateway API
  if (authKey && templateId) {
    try {
      const response = await axios.post("https://control.msg91.com/api/v5/otp", {
        template_id: templateId,
        mobile: phoneNumber,
        otp: otpCode
      }, {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json"
        }
      });

      console.log(`✅ MSG91 SMS Sent Successfully:`, response.data);
      return { success: true, response: response.data };
    } catch (error) {
      console.error(`❌ MSG91 SMS Gateway Error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Development fallback mock response
  console.log(`🧪 [DEV MOCK] WebOTP ${otpCode} sent to ${phoneNumber}`);
  return { success: true, mock: true };
}

module.exports = {
  sendWebOTP
};
