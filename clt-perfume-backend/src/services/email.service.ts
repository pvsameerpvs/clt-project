import { Resend } from 'resend'
import { buildFrontendUrl } from '../config/public-urls'

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
  contact_name?: string
  contact_whatsapp?: string
  shipping_address?: any
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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
        <span style="font-weight: 600; color: #111827;">${escapeHtml(item.product_name)}</span><br/>
        <span style="color: #6b7280; font-size: 12px;">Qty: ${escapeHtml(item.quantity)}</span>
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
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE Perfume</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #4b5563; font-size: 16px; margin-top: 0;">Hi there,</p>
            <p style="color: #111827; font-size: 18px; font-weight: 600;">We've received your order!</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">Thank you for shopping at CLE Perfume. We are processing your order and will let you know once it's on the way.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Order Number</p>
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">#${escapeHtml(order.order_number)}</p>
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
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: recipientEmail,
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
  const recipientEmail = normalizeEmailAddress(details.email)

  if (!recipientEmail) {
    console.log('[EmailService] No email provided; skipping welcome email.')
    return
  }

  const customerName = escapeHtml(details.firstName?.trim() || 'there')
  const sourceLabel = details.source === 'google' ? 'Google sign-in' : 'your new account'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE Perfume</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #4b5563; font-size: 16px; margin-top: 0;">Hi ${customerName},</p>
            <p style="color: #111827; font-size: 18px; font-weight: 600;">Thank you for joining CLE Perfume.</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 16px;">Your account is ready and ${sourceLabel} is now connected to CLE Perfume.</p>
            <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">You can now sign in, manage your profile, track orders, and continue shopping with a saved account.</p>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Account email</p>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #111827;">${escapeHtml(recipientEmail)}</p>
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
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: recipientEmail,
      subject: 'Welcome to CLE Perfume',
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

  const formattedStatus = escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))
  const formattedPaymentStatus = paymentStatus?.trim()
  const safePaymentStatus = formattedPaymentStatus ? escapeHtml(formattedPaymentStatus) : ''
  const safeOrderNumber = escapeHtml(orderNumber)

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 0; margin: 0;">
      <table align="center" width="100%" max-width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="background-color: #000000; padding: 40px 24px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE Perfume</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="color: #111827; font-size: 18px; font-weight: 600;">Order Update: ${formattedStatus}</p>
            <p style="color: #4b5563; font-size: 16px;">Hi there,</p>
            <p style="color: #4b5563; font-size: 16px;">Your order <strong>#${safeOrderNumber}</strong> has been updated to: <strong>${formattedStatus}</strong>.</p>
            ${safePaymentStatus ? `<p style="color: #4b5563; font-size: 16px;">Payment status: <strong>${safePaymentStatus}</strong>.</p>` : ''}
            <p style="color: #4b5563; font-size: 16px;">If you have any questions, simply reply to this email!</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: recipientEmail,
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
    text = "We wanted to remind you that your favorite scents are still in your cart. Come back to CLE Perfume to complete your order."
  } else {
    subject = "Still thinking about it? ✨"
    heading = "Take another look"
    text = "Your signature scent is waiting for you. Treat yourself today!"
  }

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="font-weight: 600; color: #111827; font-family: sans-serif;">${escapeHtml(item.product?.name || 'Perfume')}</span><br/>
        <span style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Qty: ${escapeHtml(item.quantity)}</span>
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
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE Perfume</div>
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

            <a href="${buildFrontendUrl('/cart')}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; text-decoration: none; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 4px;">Return To Cart</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE Perfume <contact@cleparfum.com>',
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
  const safeOrderNumber = escapeHtml(orderNumber)
  const safeStatus = escapeHtml(status)
  const safeReason = escapeHtml(reason)
  const safeAdminComment = adminComment ? escapeHtml(adminComment) : ''
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
            <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">CLE Perfume</div>
            <div style="font-family: sans-serif; font-size: 10px; color: #ffffff; letter-spacing: 0.3em; text-transform: uppercase; margin: 8px 0 0 0; opacity: 0.8;">PERFUME</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 600; font-family: serif;">Refund Request Update</h2>
            <p style="color: #4b5563; font-size: 16px;">Hello,</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your request to return items from order <strong>#${safeOrderNumber}</strong> has been <strong>${safeStatus}</strong>.
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: left;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Return Details</p>
              <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Reason:</strong> ${safeReason}</p>
              ${safeAdminComment ? `<p style="margin: 8px 0 0; font-size: 14px; color: #111827;"><strong>Note from Team:</strong> ${safeAdminComment}</p>` : ''}
            </div>

            ${isApproved 
              ? `<p style="color: #047857; font-weight: 600; font-size: 16px;">Our team will now proceed with your refund. You will receive the amount via your original payment method shortly.</p>`
              : `<p style="color: #b91c1c; font-weight: 600; font-size: 16px;">Unfortunately, we are unable to approve your refund request at this time. If you believe this is an error, please contact our support team.</p>`
            }
            
            <p style="color: #4b5563; font-size: 14px; margin-top: 32px;">Thank you for choosing CLE Perfume.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: recipientEmail,
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

export async function sendAdminNewOrderNotification(order: OrderDetails): Promise<void> {
  const adminEmail = 'infocleparfum@gmail.com'
  
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; vertical-align: top;">
        <div style="font-weight: 600; color: #1a202c; font-size: 14px;">${escapeHtml(item.product_name)}</div>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; text-align: center; color: #4a5568; font-size: 14px;">
        ${escapeHtml(item.quantity)}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #edf2f7; text-align: right; font-weight: 600; color: #1a202c; font-size: 14px;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const customerName = order.contact_name || 'Guest Customer'
  const customerEmail = order.contact_email || 'No email'
  const customerPhone = order.contact_whatsapp || 'No phone'
  
  const address = order.shipping_address || {}
  const addressHtml = address.line1 ? `
    <div style="margin-top: 10px; padding: 12px; background-color: #f7fafc; border-radius: 4px; font-size: 13px; color: #4a5568; line-height: 1.5;">
      <strong>Delivery Address:</strong><br/>
      ${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ''}<br/>
      ${escapeHtml(address.city)}${address.state ? `, ${escapeHtml(address.state)}` : ''}<br/>
      ${escapeHtml(address.country)}
    </div>
  ` : '<div style="margin-top: 10px; color: #a0aec0; font-style: italic; font-size: 13px;">No address provided</div>'

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #1a202c; padding: 30px; text-align: center;">
                  <div style="color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 8px;">Internal Notification</div>
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 400; letter-spacing: 1px;">New Order Received</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding-bottom: 30px; border-bottom: 1px solid #e2e8f0;">
                        <table width="100%">
                          <tr>
                            <td>
                              <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Order Number</div>
                              <div style="font-size: 20px; color: #1a202c; font-weight: 700;">#${escapeHtml(order.order_number)}</div>
                            </td>
                            <td align="right">
                              <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Payment Method</div>
                              <div style="font-size: 14px; color: #2d3748; font-weight: 600; background-color: #edf2f7; padding: 4px 12px; border-radius: 20px; display: inline-block;">
                                ${order.payment_method.replace(/_/g, ' ').toUpperCase()}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Customer Section -->
                    <tr>
                      <td style="padding: 30px 0; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1a202c;">Customer Details</h3>
                        <table width="100%" style="font-size: 14px; color: #4a5568;">
                          <tr>
                            <td width="100" style="padding-bottom: 8px;"><strong>Name:</strong></td>
                            <td style="padding-bottom: 8px; color: #1a202c;">${escapeHtml(customerName)}</td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 8px;"><strong>Email:</strong></td>
                            <td style="padding-bottom: 8px; color: #3182ce;">${escapeHtml(customerEmail)}</td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 8px;"><strong>WhatsApp:</strong></td>
                            <td style="padding-bottom: 8px; color: #1a202c;">${escapeHtml(customerPhone)}</td>
                          </tr>
                        </table>
                        ${addressHtml}
                      </td>
                    </tr>

                    <!-- Items Section -->
                    <tr>
                      <td style="padding-top: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1a202c;">Order Summary</h3>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <thead>
                            <tr style="background-color: #f8fafc;">
                              <th align="left" style="padding: 10px 8px; font-size: 11px; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Item</th>
                              <th align="center" style="padding: 10px 8px; font-size: 11px; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Qty</th>
                              <th align="right" style="padding: 10px 8px; font-size: 11px; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colspan="2" align="right" style="padding: 20px 8px 10px 8px; font-size: 14px; color: #4a5568;">Subtotal:</td>
                              <td align="right" style="padding: 20px 8px 10px 8px; font-size: 14px; color: #1a202c;">${formatPrice(order.subtotal)}</td>
                            </tr>
                            ${order.promo_discount > 0 ? `
                            <tr>
                              <td colspan="2" align="right" style="padding: 5px 8px; font-size: 14px; color: #4a5568;">Discount:</td>
                              <td align="right" style="padding: 5px 8px; font-size: 14px; color: #e53e3e;">-${formatPrice(order.promo_discount)}</td>
                            </tr>` : ''}
                            <tr>
                              <td colspan="2" align="right" style="padding: 15px 8px; font-size: 18px; color: #1a202c; font-weight: 700; border-top: 1px solid #e2e8f0;">Total Amount:</td>
                              <td align="right" style="padding: 15px 8px; font-size: 18px; color: #1a202c; font-weight: 700; border-top: 1px solid #e2e8f0;">${formatPrice(order.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </td>
                    </tr>

                    <!-- Actions -->
                    <tr>
                      <td align="center" style="padding-top: 40px;">
                        <a href="https://admin.cleparfum.com/dashboard/orders" style="display: inline-block; background-color: #1a202c; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.2s;">
                          Process Order in Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} CLE Perfume Management System</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const text = [
      `New order received: #${order.order_number}`,
      `Customer: ${customerName}`,
      `Email: ${customerEmail}`,
      `WhatsApp: ${customerPhone}`,
      `Payment: ${order.payment_method.replace(/_/g, ' ')}`,
      `Total: ${formatPrice(order.total)}`,
    ].join('\n')

    const { error } = await resend.emails.send({
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: adminEmail,
      subject: `New order #${order.order_number} - ${customerName}`,
      html,
      text,
    })
    if (error) {
      console.error('[AdminEmail] Failed to send admin notification:', error)
      return
    }

    console.log(`[AdminEmail] Notification sent for order #${order.order_number}`)
  } catch (error) {
    console.error('[AdminEmail] Failed to send admin notification:', error)
  }
}

export async function sendAdminOrderCancellationNotification(order: { order_number: string; total: number; reason?: string }): Promise<void> {
  const adminEmail = 'infocleparfum@gmail.com'
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #dc2626; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px;">ORDER CANCELLED</h1>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #374151;">Order <strong>#${escapeHtml(order.order_number)}</strong> has been cancelled.</p>
        
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #fee2e2;">
          <p style="margin: 0; font-size: 12px; color: #991b1b; text-transform: uppercase;">Amount Lost</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">${formatPrice(order.total)}</p>
          
          ${order.reason ? `
          <p style="margin: 12px 0 0; font-size: 12px; color: #991b1b; text-transform: uppercase;">Reason</p>
          <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${escapeHtml(order.reason)}</p>
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="https://admin.cleparfum.com/dashboard/orders" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">VIEW ORDER HISTORY</a>
        </div>
      </div>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: 'CLE Perfume <contact@cleparfum.com>',
      to: adminEmail,
      subject: `Order cancelled #${order.order_number}`,
      html: html,
      text: `Order cancelled: #${order.order_number}\nAmount lost: ${formatPrice(order.total)}${order.reason ? `\nReason: ${order.reason}` : ''}`,
    })
    if (error) {
      console.error('[AdminEmail] Failed to send cancellation notification:', error)
      return
    }

    console.log(`[AdminEmail] Cancellation notification sent for #${order.order_number}`)
  } catch (error) {
    console.error('[AdminEmail] Failed to send cancellation notification:', error)
  }
}
