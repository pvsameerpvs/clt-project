const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function simulatePayment() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Please provide an Order ID as an argument.');
    console.log('Usage: node scripts/simulate-ziina-payment.js <order-id>');
    process.exit(1);
  }

  console.log(`Looking up order: ${orderId}...`);

  // Fetch the order to get the stripe_session_id (Ziina intent ID) and amount
  const { data: order, error } = await supabase
    .from('orders')
    .select('stripe_session_id, total')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error('Order not found in database:', error?.message);
    process.exit(1);
  }

  if (!order.stripe_session_id) {
    console.error('This order does not have a Ziina payment intent ID (stripe_session_id is null).');
    process.exit(1);
  }

  const amountFils = Math.round(Number(order.total) * 100);
  const intentId = order.stripe_session_id;

  console.log(`Found order. Simulating Ziina webhook for intent: ${intentId}`);

  try {
    const payload = {
      event: 'payment_intent.status.updated',
      data: {
        id: intentId,
        status: 'completed',
        amount: amountFils,
        currency_code: 'AED'
      }
    };
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };

    if (process.env.ZIINA_WEBHOOK_SECRET) {
      headers['X-Hmac-Signature'] = crypto
        .createHmac('sha256', process.env.ZIINA_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    }

    const response = await axios.post('http://localhost:4000/api/webhooks/ziina', body, { headers });

    console.log('Webhook simulation successful!');
    console.log('Check your email and your database/dashboard to see the order marked as Paid.');
  } catch (err) {
    console.error('Webhook simulation failed:', err?.response?.data || err.message);
    console.log('Make sure your backend is running on port 4000!');
  }
}

simulatePayment();
