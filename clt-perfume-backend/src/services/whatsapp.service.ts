import twilio from 'twilio'
import fs from 'fs'

// Initialize Twilio client ONLY if keys are actually provided.
// This prevents the backend from crashing while you haven't set up the keys yet.
let client: twilio.Twilio | null = null

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid_here') {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export type WhatsAppOrderDetails = {
  order_number: string
  total: number
  contact_whatsapp?: string
  items?: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

export async function sendOrderWhatsAppConfirmation(order: WhatsAppOrderDetails) {
  if (!order.contact_whatsapp) {
    console.log('[WhatsAppService] No whatsapp number provided; skipping message.')
    return
  }

  if (!client) {
    console.log('[WhatsAppService] Twilio keys not configured in .env yet. Message not sent.')
    console.log(`[WhatsAppService] Would have sent to ${order.contact_whatsapp}: "We've received your order! Thank you..."`)
    return
  }

  // Format the number to E.164 format (e.g. +971501234567)
  let formattedNumber = order.contact_whatsapp.trim().replace(/\s/g, '')
  
  if (!formattedNumber.startsWith('+')) {
    // Handle UAE numbers (e.g., 056... or 56...)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '971' + formattedNumber.slice(1)
    } else if (formattedNumber.length === 9 && (formattedNumber.startsWith('5') || formattedNumber.startsWith('2'))) {
      // Very specific to UAE 9-digit local format
      formattedNumber = '971' + formattedNumber
    }
    
    formattedNumber = '+' + formattedNumber 
  }

  console.log(`[WhatsAppService] Preparing to send to: whatsapp:${formattedNumber} from: whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`)

  // Format items list
  const itemsText = (order.items || [])
    .map(item => `• ${item.product_name} x${item.quantity}`)
    .join('\n')

  const messageText = `We've received your order! 🎉

*Order Number:* #${order.order_number}

*Items:*
${itemsText || 'Details in email'}

*Total:* AED ${Math.round(order.total)}

Thank you for shopping at CLE DXB. We are processing your order and will let you know once it's on the way.`

  try {
    const logMsg = `[${new Date().toISOString()}] Attempting to send to ${formattedNumber} (Order: ${order.order_number})\n`
    fs.appendFileSync('whatsapp_debug.log', logMsg)
    
    const message = await client.messages.create({
      body: messageText,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    })

    const successMsg = `[${new Date().toISOString()}] SUCCESS! SID: ${message.sid}\n`
    fs.appendFileSync('whatsapp_debug.log', successMsg)
    console.log(`[WhatsAppService] Message sent successfully! SID: ${message.sid}`)
  } catch (error: any) {
    const errorMsg = `[${new Date().toISOString()}] ERROR: ${error.message}\n`
    fs.appendFileSync('whatsapp_debug.log', errorMsg)
    console.error('[WhatsAppService] Twilio Error:', error)
  }
}

export async function sendOrderStatusWhatsApp(orderNumber: string, status: string, contactWhatsapp?: string) {
  if (!contactWhatsapp || !client) return

  let formattedNumber = contactWhatsapp.trim().replace(/\s/g, '')
  if (!formattedNumber.startsWith('+')) {
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '971' + formattedNumber.slice(1)
    } else if (formattedNumber.length === 9 && (formattedNumber.startsWith('5') || formattedNumber.startsWith('2'))) {
      formattedNumber = '971' + formattedNumber
    }
    formattedNumber = '+' + formattedNumber 
  }

  // Basic validation: A valid E.164 number should be at least 11 chars (e.g. +971501234567)
  if (formattedNumber.length < 11) {
    console.log(`[WhatsAppService] Skipping invalid number: ${formattedNumber}`)
    return
  }

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  const messageText = `*Order Update:* #${orderNumber} 🎉

Hi there! The status of your CLE DXB order is now: *${formattedStatus}*.

Thank you for shopping with us!`

  try {
    await client.messages.create({
      body: messageText,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    })
    console.log(`[WhatsAppService] Status message sent for #${orderNumber}`)
  } catch (error) {
    console.error('[WhatsAppService] Twilio Status Error:', error)
  }
}
