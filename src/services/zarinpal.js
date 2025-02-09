const axios = require('axios');

const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const BASE_URL = SANDBOX 
  ? 'https://sandbox.zarinpal.com/pg' 
  : 'https://api.zarinpal.com/pg';

/**
 * Request payment from Zarinpal
 * @param {number} amount - Amount in Toman
 * @param {string} description - Payment description
 * @param {string} orderId - Order ID for callback
 * @returns {Promise<{url: string, authority: string}>}
 */
async function requestPayment(amount, description, orderId) {
  try {
    const response = await axios.post(`${BASE_URL}/v4/payment/request.json`, {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amount,
      description: description,
      callback_url: `${process.env.ZARINPAL_CALLBACK_URL}?order_id=${orderId}`,
    });

    if (response.data.data.code === 100) {
      return {
        url: `${BASE_URL}/StartPay/${response.data.data.authority}`,
        authority: response.data.data.authority
      };
    } else {
      throw new Error(`خطا در ایجاد درخواست پرداخت: ${response.data.errors.message}`);
    }
  } catch (error) {
    console.error('Error requesting payment:', error);
    throw new Error('خطا در ارتباط با درگاه پرداخت');
  }
}

/**
 * Verify payment with Zarinpal
 * @param {string} authority - Payment authority code
 * @param {number} amount - Amount in Toman
 * @returns {Promise<{refId: string, success: boolean}>}
 */
async function verifyPayment(authority, amount) {
  try {
    const response = await axios.post(`${BASE_URL}/v4/payment/verify.json`, {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amount,
      authority: authority
    });

    if (response.data.data.code === 100) {
      return {
        refId: response.data.data.ref_id,
        success: true
      };
    } else {
      return {
        success: false,
        message: getErrorMessage(response.data.errors.code)
      };
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('خطا در تایید پرداخت');
  }
}

/**
 * Get error message based on Zarinpal error code
 * @param {number} code - Error code
 * @returns {string} Error message in Persian
 */
function getErrorMessage(code) {
  const errors = {
    '-9': 'خطا در اعتبارسنجی اطلاعات',
    '-10': 'آی‌پی یا مرچنت کد پذیرنده صحیح نیست',
    '-11': 'مرچنت کد فعال نیست',
    '-12': 'تلاش بیش از حد در یک بازه زمانی کوتاه',
    '-15': 'ترمینال شما به حالت تعلیق در آمده است',
    '-16': 'سطح تایید پذیرنده پایین تر از سطح نقره ای است',
    '-30': 'اجازه دسترسی به تسویه اشتراکی شناور ندارید',
    '-31': 'حساب بانکی تسویه را به پنل اضافه کنید',
    '-32': 'مبلغ وارد شده از مبلغ کل تراکنش بیشتر است',
    '-33': 'درصدهای وارد شده صحیح نیست',
    '-34': 'مبلغ وارد شده از مبلغ کل تراکنش بیشتر است',
    '-35': 'تعداد افراد دریافت کننده تسهیم بیش از حد مجاز است',
    '-40': 'پارامترهای اضافی نامعتبر، expire را چک کنید',
    '-50': 'مبلغ پرداخت شده با مقدار مبلغ در وریفای متفاوت است',
    '-51': 'پرداخت ناموفق',
    '-52': 'خطای غیر منتظره با پشتیبانی تماس بگیرید',
    '-53': 'اتوریتی برای این مرچنت کد نیست',
    '-54': 'اتوریتی نامعتبر است'
  };
  
  return errors[code] || 'خطای ناشناخته';
}

module.exports = {
  requestPayment,
  verifyPayment
}; 