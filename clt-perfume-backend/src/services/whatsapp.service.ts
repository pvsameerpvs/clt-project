import twilio from 'twilio'

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
  let formattedNumber = order.contact_whatsapp.trim()
  if (!formattedNumber.startsWith('+')) {
    // Assuming mostly UAE numbers if no plus is provided; adjust logic if needed.
    // Usually, you should ensure the frontend passes the plus sign + country code!
    formattedNumber = '+' + formattedNumber 
  }

  const messageText = `We've received your order! 🎉

*Order Number:* #${order.order_number}
*Total:* AED ${Math.round(order.total)}

Thank you for shopping at CLE Perfumes. We are processing your order and will let you know once it's on the way.`

  try {
    const message = await client.messages.create({
      body: messageText,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    })

    console.log(`[WhatsAppService] Message sent successfully! SID: ${message.sid}`)
  } catch (error) {
    console.error('[WhatsAppService] Twilio Error:', error)
  }
}

export async function sendOrderStatusWhatsApp(orderNumber: string, status: string, contactWhatsapp?: string) {
  if (!contactWhatsapp || !client) return

  let formattedNumber = contactWhatsapp.trim()
  if (!formattedNumber.startsWith('+')) {
    formattedNumber = '+' + formattedNumber 
  }

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  const messageText = `*Order Update:* #${orderNumber} 🎉

Hi there! The status of your CLE Perfumes order is now: *${formattedStatus}*.

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
