const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function simulatePayment() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('❌ Please provide an Order ID as an argument.');
    console.log('Usage: node scripts/simulate-ziina-payment.js <order-id>');
    process.exit(1);
  }

  console.log(`🔍 Looking up order: ${orderId}...`);

  // Fetch the order to get the stripe_session_id (Ziina intent ID) and amount
  const { data: order, error } = await supabase
    .from('orders')
    .select('stripe_session_id, total')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error('❌ Order not found in database:', error?.message);
    process.exit(1);
  }

  if (!order.stripe_session_id) {
    console.error('❌ This order does not have a Ziina payment intent ID (stripe_session_id is null).');
    process.exit(1);
  }

  const amountFils = Math.round(Number(order.total) * 100);
  const intentId = order.stripe_session_id;

  console.log(`✅ Found Order. Attempting to simulate Ziina Webhook for Intent: ${intentId}`);

  try {
    const response = await axios.post('http://localhost:4000/api/webhooks/ziina', {
      event: 'payment_intent.status.updated',
      status: 'completed',
      id: intentId,
      amount: amountFils
    });

    console.log('🎉 Webhook Simulation Successful!');
    console.log('Check your email and your database/dashboard to see the order marked as Paid.');
  } catch (err) {
    console.error('❌ Webhook Simulation Failed:', err?.response?.data || err.message);
    console.log('Make sure your backend is running on port 4000!');
  }
}

simulatePayment();
