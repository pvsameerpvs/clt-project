import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function registerWebhook() {
  const ZIINA_API_KEY = process.env.ZIINA_API_KEY
  // NOTE: Replace this with your actual production backend URL!
  const WEBHOOK_URL = 'https://api.yourdomain.com/api/webhooks/ziina'
  // NOTE: Generate a random string to be your secret, and add it to your .env file as ZIINA_WEBHOOK_SECRET
  const WEBHOOK_SECRET = 'your_super_secret_string_123'

  if (!ZIINA_API_KEY) {
    console.error('❌ ZIINA_API_KEY is not set in .env')
    process.exit(1)
  }

  try {
    console.log(`Registering webhook for URL: ${WEBHOOK_URL}`)
    
    const response = await axios.post(
      'https://api-v2.ziina.com/api/webhook',
      {
        url: WEBHOOK_URL,
        secret: WEBHOOK_SECRET
      },
      {
        headers: {
          Authorization: `Bearer ${ZIINA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('✅ Webhook successfully registered!')
    console.log('Response:', response.data)
  } catch (error: any) {
    console.error('❌ Failed to register webhook:', error?.response?.data || error.message)
  }
}

registerWebhook()
