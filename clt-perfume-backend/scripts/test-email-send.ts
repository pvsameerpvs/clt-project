import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from the root of the backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { sendOrderConfirmationEmail, sendOrderStatusEmail, OrderDetails } from '../src/services/email.service';

async function runTest() {
  console.log('🚀 Starting Full Email Suite Test...');
  console.log('Using API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

  const testOrder: OrderDetails = {
    order_number: 'TEST-' + Math.floor(Math.random() * 10000),
    contact_email: 'infocleparfum@gmail.com',
    subtotal: 150,
    shipping_fee: 0,
    promo_discount: 0,
    total: 150,
    payment_method: 'Credit Card',
    items: [
      {
        product_name: 'Test Perfume Oud',
        quantity: 1,
        price: 150
      }
    ]
  };

  // --- Test 1: Order Confirmation ---
  console.log('\n1️⃣ Testing: Order Confirmation Email...');
  try {
    const result = await sendOrderConfirmationEmail(testOrder);
    if (result.ok) {
      console.log('✅ SUCCESS: Order Confirmation sent.');
    } else {
      console.error('❌ FAILED:', result.error);
    }
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error);
  }

  // --- Test 2: Order Status Update ---
  console.log('\n2️⃣ Testing: Order Status Update Email...');
  try {
    const result = await sendOrderStatusEmail(
      testOrder.order_number,
      'shipped',
      'infocleparfum@gmail.com',
      'paid'
    );
    if (result.ok) {
      console.log('✅ SUCCESS: Status Update email sent.');
    } else {
      console.error('❌ FAILED:', result.error);
    }
  } catch (error) {
    console.error('💥 UNEXPECTED ERROR:', error);
  }

  console.log('\n✨ All tests completed. Check your inbox at infocleparfum@gmail.com');
}

runTest();
