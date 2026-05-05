import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function registerWebhook() {
  const ZIINA_API_KEY = process.env.ZIINA_API_KEY
  const WEBHOOK_URL = process.env.ZIINA_WEBHOOK_URL
  const WEBHOOK_SECRET = process.env.ZIINA_WEBHOOK_SECRET

  if (!ZIINA_API_KEY) {
    console.error('ZIINA_API_KEY is not set in .env')
    process.exit(1)
  }

  if (!WEBHOOK_URL) {
    console.error('ZIINA_WEBHOOK_URL is not set in .env')
    process.exit(1)
  }

  if (!WEBHOOK_SECRET) {
    console.error('ZIINA_WEBHOOK_SECRET is not set in .env')
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

    console.log('Webhook successfully registered!')
    console.log('Response:', response.data)
  } catch (error: any) {
    console.error('Failed to register webhook:', error?.response?.data || error.message)
  }
}

registerWebhook()
