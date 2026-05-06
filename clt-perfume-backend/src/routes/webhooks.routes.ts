import { Router, Request, Response } from 'express'
import express from 'express'
import {
  getZiinaPaymentIntent,
  getZiinaPaymentIntentFromWebhook,
  isZiinaWebhookSourceAllowed,
  parseZiinaWebhookEvent,
  verifyZiinaWebhookSignature,
} from '../services/ziina.service'
import {
  fulfillPaidOrderPayment,
  markOrderPaymentUnsuccessful,
} from '../services/payment-fulfillment.service'

export const webhookRoutes = Router()

function getRawBody(req: Request) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8')
  return Buffer.from(JSON.stringify(req.body || {}), 'utf8')
}

function getRequestIp(req: Request) {
  if (req.ip) return req.ip
  if (req.socket.remoteAddress) return req.socket.remoteAddress

  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0].trim()
  }

  return ''
}

webhookRoutes.post(
  '/ziina',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const rawBody = getRawBody(req)
    const sourceIp = getRequestIp(req)

    if (!isZiinaWebhookSourceAllowed(sourceIp)) {
      console.error('Rejected Ziina webhook from unexpected IP:', sourceIp)
      res.status(403).json({ error: 'Webhook source is not allowed' })
      return
    }

    const signatureVerification = verifyZiinaWebhookSignature(rawBody, req.headers['x-hmac-signature'])
    if (!signatureVerification.ok) {
      console.error('Rejected Ziina webhook signature:', signatureVerification.reason)
      res.status(401).json({ error: signatureVerification.reason || 'Invalid webhook signature' })
      return
    }

    try {
      const event = parseZiinaWebhookEvent(rawBody)
      const webhookPaymentIntent = getZiinaPaymentIntentFromWebhook(event)

      if (!webhookPaymentIntent) {
        res.json({ received: true, ignored: true })
        return
      }

      let paymentIntent = webhookPaymentIntent
      try {
        paymentIntent = await getZiinaPaymentIntent(webhookPaymentIntent.id)
      } catch (error: any) {
        console.error('Failed to refresh Ziina payment intent from webhook:', error?.response?.data || error?.message || error)
        if (webhookPaymentIntent.status === 'completed') {
          res.status(502).json({ received: false, error: 'Payment status could not be verified' })
          return
        }
      }

      console.log('Received Ziina payment webhook:', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      })

      if (paymentIntent.status === 'completed') {
        const fulfilled = await fulfillPaidOrderPayment({
          providerPaymentId: paymentIntent.id,
          providerSessionId: paymentIntent.id,
          amountTotalFils: paymentIntent.amount,
          currencyCode: paymentIntent.currency_code,
        })

        if (!fulfilled) {
          res.status(409).json({ received: false, error: 'Payment could not be fulfilled' })
          return
        }
      }

      if (paymentIntent.status === 'failed' || paymentIntent.status === 'canceled') {
        await markOrderPaymentUnsuccessful({
          providerPaymentId: paymentIntent.id,
          status: paymentIntent.status,
        })
      }

      res.json({ received: true })
    } catch (err: any) {
      console.error('Ziina webhook error:', err.message)
      res.status(400).send(`Webhook Error: ${err.message}`)
    }
  }
)
