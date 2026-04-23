import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}

export type OrderDetails = {
  order_number: string
  subtotal: number
  total: number
  promo_discount: number
  shipping_fee: number
  payment_method: string
  items: Array<{
    product_name: string
    quantity: number
    price: number
    product_image?: string | null
  }>
  contact_email?: string
}

type WelcomeEmailDetails = {
  email: string
  firstName?: string
  source?: 'signup' | 'google'
}

type EmailSendResult = {
  ok: boolean
  skipped?: boolean
  error?: string
}

function normalizeEmailAddress(value?: string | null) {
  const email = String(value || '').trim().toLowerCase()
  return email && email.includes('@') ? email : ''
}

export async function sendOrderConfirmationEmail(order: OrderDetails): Promise<EmailSendResult> {
  const recipientEmail = normalizeEmailAddress(order.contact_email)

  if (!recipientEmail) {
    console.log('[EmailService] No valid contact email provided; skipping receipt.')
    return { ok: false, skipped: true, error: 'No valid contact email provided' }
  }

  // Create an HTML template manually as a string
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6;">
        <span style="font-weight: 600; color: #111827;">${item.product_name}</span><br/>
        <span style="color: #6b7280; font-size: 12px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #111827; font-weight: 500;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const promoRowHtml = order.promo_discount > 0 ? `
    <tr>
      <td style="padding: 12px; font-weight: 500; color: #111827;">Promo Discount:</td>
      <td style="padding: 12px; text-align: right; color: #047857; font-weight: 500;">-${formatPrice(order.promo_discount)}</td>
    </tr>
  ` : ''

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE DXB</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #4b5563; font-size: 16px; margin-top: 0;">Hi there,</p>
            <p style="color: #111827; font-size: 18px; font-weight: 600;">We've received your order!</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">Thank you for shopping at CLE DXB. We are processing your order and will let you know once it's on the way.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Order Number</p>
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">#${order.order_number}</p>
            </div>

            <table width="100%" style="border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
              ${itemsHtml}
            </table>

            <table width="100%" style="border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 12px; font-weight: 500; color: #111827;">Subtotal:</td>
                <td style="padding: 12px; text-align: right; color: #111827;">${formatPrice(order.subtotal)}</td>
              </tr>
              ${promoRowHtml}
              <tr>
                <td style="padding: 12px; font-weight: 500; color: #111827;">Shipping:</td>
                <td style="padding: 12px; text-align: right; color: #111827;">FREE</td>
              </tr>
              <tr>
                <td style="padding: 16px 12px; font-weight: 600; color: #111827; font-size: 16px; border-top: 2px solid #e5e7eb;">Total:</td>
                <td style="padding: 16px 12px; text-align: right; color: #111827; font-weight: 600; font-size: 16px; border-top: 2px solid #e5e7eb;">${formatPrice(order.total)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Have a question? Reply to this email, we're happy to help.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE DXB <info@cleparfum.com>',
      to: recipientEmail,
      bcc: 'infocleparfum@gmail.com', // ⬅️ Sent copy to client
      subject: `Order Confirmation #${order.order_number}`,
      html: html
    })

    if (error) {
      console.error('[EmailService] Resend Error:', error)
      return { ok: false, error: error.message || 'Resend failed to send order confirmation email' }
    } else {
      console.log('[EmailService] Email sent successfully:', data)
      return { ok: true }
    }
  } catch (err) {
    console.error('[EmailService] Unexpected Error:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unexpected error while sending order confirmation email',
    }
  }
}

export async function sendWelcomeEmail(details: WelcomeEmailDetails) {
  if (!details.email) {
    console.log('[EmailService] No email provided; skipping welcome email.')
    return
  }

  const customerName = details.firstName?.trim() || 'there'
  const sourceLabel = details.source === 'google' ? 'Google sign-in' : 'your new account'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE DXB</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #4b5563; font-size: 16px; margin-top: 0;">Hi ${customerName},</p>
            <p style="color: #111827; font-size: 18px; font-weight: 600;">Thank you for joining CLE DXB.</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 16px;">Your account is ready and ${sourceLabel} is now connected to CLE DXB.</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">You can now sign in, manage your profile, track orders, and continue shopping with a saved account.</p>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Account email</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">${details.email}</p>
            </div>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">If you did not create this account, please reply to this email so we can help right away.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE DXB <info@cleparfum.com>',
      to: details.email,
      subject: 'Welcome to CLE DXB',
      html,
    })

    if (error) {
      console.error('[EmailService] Welcome Email Error:', error)
    } else {
      console.log('[EmailService] Welcome email sent successfully:', data)
    }
  } catch (err) {
    console.error('[EmailService] Unexpected Welcome Email Error:', err)
  }
}

export async function sendOrderStatusEmail(
  orderNumber: string,
  status: string,
  contactEmail?: string,
  paymentStatus?: string
): Promise<EmailSendResult> {
  const recipientEmail = normalizeEmailAddress(contactEmail)

  if (!recipientEmail) {
    console.log('[EmailService] No valid contact email provided; skipping order status email.')
    return { ok: false, skipped: true, error: 'No valid contact email provided' }
  }

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  const formattedPaymentStatus = paymentStatus?.trim()

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE DXB</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #111827; font-size: 18px; font-weight: 600;">Order Update: ${formattedStatus}</p>
            <p style="color: #4b5563; font-size: 16px;">Hi there,</p>
            <p style="color: #4b5563; font-size: 16px;">Your order <strong>#${orderNumber}</strong> has been updated to: <strong>${formattedStatus}</strong>.</p>
            ${formattedPaymentStatus ? `<p style="color: #4b5563; font-size: 16px;">Payment status: <strong>${formattedPaymentStatus}</strong>.</p>` : ''}
            <p style="color: #4b5563; font-size: 16px;">If you have any questions, simply reply to this email!</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE DXB <info@cleparfum.com>',
      to: recipientEmail,
      bcc: 'infocleparfum@gmail.com', // Sent copy to admin
      subject: `Order Update #${orderNumber} - ${formattedStatus}`,
      html: html,
    })

    if (error) {
      console.error('[EmailService] Status Email Error:', error)
      return { ok: false, error: error.message || 'Resend failed to send order status email' }
    }

    console.log('[EmailService] Status email sent successfully:', data)
    return { ok: true }
  } catch (error) {
    console.error('[EmailService] Unexpected Status Email Error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error while sending order status email',
    }
  }
}

export async function sendAbandonedCartEmail(recipientEmail: string, items: any[], stage: number): Promise<EmailSendResult> {
  const email = normalizeEmailAddress(recipientEmail)
  if (!email) return { ok: false, error: 'No email provided' }

  let subject = "You left something behind..."
  let heading = "Did you forget something?"
  let text = "We saved your cart for you. Check out now before they run out of stock!"
  
  if (stage === 1) {
    subject = "You left something behind..."
  } else if (stage === 2) {
    subject = "Your CLE Perfume is still waiting for you 🖤"
    heading = "Your Cart is Expiring Soon"
    text = "We wanted to remind you that your favorite scents are still in your cart. Come back to CLE DXB to complete your order."
  } else {
    subject = "Still thinking about it? ✨"
    heading = "Take another look"
    text = "Your signature scent is waiting for you. Treat yourself today!"
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="font-weight: 600; color: #111827; font-family: sans-serif;">${item.product?.name || 'Perfume'}</span><br/>
        <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Qty: ${item.quantity}</span>
      </td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <!-- Navbar with Logo -->
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE DXB</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 24px; text-align: center;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 600; margin-top: 0; font-family: serif;">${heading}</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px; font-weight: 300;">${text}</p>
            
            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
              <table width="100%" style="border-collapse: collapse; font-size: 14px; text-align: center;">
                ${itemsHtml}
              </table>
            </div>

            <a href="https://cleparfum.com/cart" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 4px;">Return To Cart</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE DXB <info@cleparfum.com>',
      to: email,
      subject: subject,
      html: html,
    })

    if (error) throw error
    console.log('[EmailService] Abandoned Cart sent:', data?.id)
    return { ok: true }
  } catch (err: any) {
    console.error('[EmailService] Abandoned Cart Email Error:', err.message)
    return { ok: false, error: err.message }
  }
}

export async function sendReturnStatusEmail(
  orderNumber: string,
  status: 'approved' | 'rejected',
  reason: string,
  contactEmail?: string,
  adminComment?: string
): Promise<EmailSendResult> {
  const recipientEmail = normalizeEmailAddress(contactEmail)
  if (!recipientEmail) return { ok: false, error: 'No email provided' }

  const isApproved = status === 'approved'
  const subject = isApproved 
    ? `Refund Request Approved - Order #${orderNumber}`
    : `Refund Request Update - Order #${orderNumber}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE DXB</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 600; font-family: serif;">Refund Request Update</h2>
            <p style="color: #4b5563; font-size: 16px;">Hello,</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your request to return items from order <strong>#${orderNumber}</strong> has been <strong>${status}</strong>.
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: left;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Return Details</p>
              <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reason:</strong> ${reason}</p>
              ${adminComment ? `<p style="margin: 8px 0 0; font-size: 14px; color: #111827;"><strong>Note from Team:</strong> ${adminComment}</p>` : ''}
            </div>

            ${isApproved 
              ? `<p style="color: #047857; font-weight: 600; font-size: 16px;">Our team will now proceed with your refund. You will receive the amount via your original payment method shortly.</p>`
              : `<p style="color: #b91c1c; font-weight: 600; font-size: 16px;">Unfortunately, we are unable to approve your refund request at this time. If you believe this is an error, please contact our support team.</p>`
            }
            
            <p style="color: #4b5563; font-size: 14px; margin-top: 32px;">Thank you for choosing CLE DXB.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE DXB <info@cleparfum.com>',
      to: recipientEmail,
      bcc: 'infocleparfum@gmail.com',
      subject: subject,
      html: html,
    })

    if (error) throw error
    return { ok: true }
  } catch (err: any) {
    console.error('[EmailService] Return Status Email Error:', err.message)
    return { ok: false, error: err.message }
  }
}
