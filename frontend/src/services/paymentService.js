// Simulated Payment Service for Card & KHQR (Bakong standard)
import { delay } from './api';

export const paymentService = {
  // Simulate Credit Card processing
  async processCardPayment(cardDetails, amount) {
    await delay(1200);
    // Basic Luhn or simple validation
    const cleanNum = cardDetails.cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15 || cleanNum.length > 19) {
      throw new Error('Invalid card number. Please check your details.');
    }
    if (!cardDetails.expiryDate || !cardDetails.cvv) {
      throw new Error('Please fill in complete card details.');
    }
    return {
      status: 'PAID',
      transactionId: 'TXN-' + Math.floor(100000000 + Math.random() * 900000000),
      paymentMethod: 'Credit / Debit Card',
      cardLast4: cleanNum.slice(-4),
      paidAt: new Date().toISOString()
    };
  },

  // Simulate KHQR Bakong payment confirmation
  async verifyKHQRPayment(md5Hash) {
    await delay(800);
    return {
      status: 'PAID',
      transactionId: 'KHQR-' + Math.floor(100000000 + Math.random() * 900000000),
      paymentMethod: 'KHQR (Bakong / ABA / Wing / ACLEDA)',
      paidAt: new Date().toISOString()
    };
  }
};
