import axios from 'axios'
import crypto from 'crypto'

const DEFAULT_ZIINA_API_BASE_URL = 'https://api-v2.ziina.com/api'
const DEFAULT_ZIINA_WEBHOOK_IPS = [
  '3.29.184.186',
  '3.29.190.95',
  '20.233.47.127',
]
const TRUE_ENV_VALUES = new Set(['true', '1', 'yes', 'on'])

export type ZiinaPaymentIntentStatus =
  | 'requires_payment_instrument'
  | 'requires_user_action'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'canceled'

export type ZiinaPaymentIntent = {
  id: string
  amount: number
  currency_code: string
  status: ZiinaPaymentIntentStatus
  redirect_url?: string | null
  embedded_url?: string | null
  success_url?: string | null
  cancel_url?: string | null
  latest_error?: {
    message?: string
    code?: string
  } | null
}

export type ZiinaWebhookEvent = {
  event?: string
  data?: unknown
}

type CreateZiinaPaymentIntentInput = {
  amount: number
  currencyCode: string
  message?: string
  successUrl: string
  cancelUrl: string
  failureUrl?: string
  expiry?: string
  test?: boolean
}

type SignatureVerificationResult = {
  ok: boolean
  reason?: string
}

function getZiinaApiBaseUrl() {
  return (process.env.ZIINA_API_BASE_URL || DEFAULT_ZIINA_API_BASE_URL).replace(/\/+$/, '')
}

function getZiinaApiKey() {
  const apiKey = process.env.ZIINA_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('ZIINA_API_KEY is not configured')
  }
  return apiKey
}

function getZiinaWebhookSecret() {
  return process.env.ZIINA_WEBHOOK_SECRET?.trim() || ''
}

function normalizeSignatureHeader(signatureHeader: unknown) {
  const rawSignature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : typeof signatureHeader === 'string'
      ? signatureHeader
      : ''

  return rawSignature
    .trim()
    .replace(/^sha256=/i, '')
}

function isSha256HexSignature(value: string) {
  return /^[a-f0-9]{64}$/i.test(value)
}

function toTimingSafeBuffer(value: string) {
  return Buffer.from(value.toLowerCase(), 'hex')
}

function normalizeIp(value?: string | null) {
  if (!value) return ''
  return value.trim().replace(/^::ffff:/, '')
}

function getConfiguredWebhookIps() {
  const configured = process.env.ZIINA_WEBHOOK_ALLOWED_IPS
    ?.split(',')
    .map(normalizeIp)
    .filter(Boolean)

  return configured?.length ? configured : DEFAULT_ZIINA_WEBHOOK_IPS
}

export function shouldCreateZiinaTestPayment() {
  const value = process.env.ZIINA_TEST_MODE?.trim().toLowerCase()
  const enabled = TRUE_ENV_VALUES.has(value || '')

  if (enabled && process.env.NODE_ENV === 'production') {
    throw new Error('ZIINA_TEST_MODE must be disabled in production')
  }

  return enabled
}

export async function createZiinaPaymentIntent(input: CreateZiinaPaymentIntentInput) {
  if (!Number.isFinite(input.amount) || input.amount < 200) {
    throw new Error('Ziina payment amount must be at least AED 2')
  }

  const response = await axios.post<ZiinaPaymentIntent>(
    `${getZiinaApiBaseUrl()}/payment_intent`,
    {
      amount: input.amount,
      currency_code: input.currencyCode,
      message: input.message,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      failure_url: input.failureUrl,
      expiry: input.expiry,
      allow_tips: false,
      test: input.test,
    },
    {
      headers: {
        Authorization: `Bearer ${getZiinaApiKey()}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.data?.id) {
    throw new Error('Ziina did not return a payment intent id')
  }

  if (Number(response.data.amount) !== input.amount) {
    throw new Error('Ziina returned a payment amount that does not match the order total')
  }

  if (String(response.data.currency_code || '').toUpperCase() !== input.currencyCode.toUpperCase()) {
    throw new Error('Ziina returned a payment currency that does not match the order currency')
  }

  if (!response.data.redirect_url) {
    throw new Error('Ziina did not return a redirect URL')
  }

  return response.data
}

export async function getZiinaPaymentIntent(paymentIntentId: string) {
  const response = await axios.get<ZiinaPaymentIntent>(
    `${getZiinaApiBaseUrl()}/payment_intent/${encodeURIComponent(paymentIntentId)}`,
    {
      headers: {
        Authorization: `Bearer ${getZiinaApiKey()}`,
      },
    }
  )

  return response.data
}

export function parseZiinaWebhookEvent(rawBody: Buffer): ZiinaWebhookEvent {
  const parsed = JSON.parse(rawBody.toString('utf8')) as ZiinaWebhookEvent
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid Ziina webhook payload')
  }

  return parsed
}

export function getZiinaPaymentIntentFromWebhook(event: ZiinaWebhookEvent) {
  if (event.event !== 'payment_intent.status.updated') {
    return null
  }

  if (!event.data || typeof event.data !== 'object') {
    throw new Error('Ziina webhook is missing payment intent data')
  }

  const intent = event.data as Partial<ZiinaPaymentIntent>
  if (!intent.id || !intent.status) {
    throw new Error('Ziina webhook payment intent data is incomplete')
  }

  return intent as ZiinaPaymentIntent
}

export function verifyZiinaWebhookSignature(rawBody: Buffer, signatureHeader: unknown): SignatureVerificationResult {
  const secret = getZiinaWebhookSecret()

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'ZIINA_WEBHOOK_SECRET is required in production' }
    }

    return { ok: true }
  }

  const receivedSignature = normalizeSignatureHeader(signatureHeader)
  if (!receivedSignature) {
    return { ok: false, reason: 'Missing X-Hmac-Signature header' }
  }

  if (!isSha256HexSignature(receivedSignature)) {
    return { ok: false, reason: 'Invalid webhook signature' }
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  const receivedBuffer = toTimingSafeBuffer(receivedSignature)
  const expectedBuffer = toTimingSafeBuffer(expectedSignature)

  if (receivedBuffer.length !== expectedBuffer.length) {
    return { ok: false, reason: 'Invalid webhook signature' }
  }

  if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return { ok: false, reason: 'Invalid webhook signature' }
  }

  return { ok: true }
}

export function shouldEnforceZiinaWebhookIpAllowlist() {
  if (process.env.NODE_ENV === 'production') {
    return true
  }

  return TRUE_ENV_VALUES.has(process.env.ZIINA_WEBHOOK_ENFORCE_IP_ALLOWLIST?.trim().toLowerCase() || '')
}

export function isZiinaWebhookSourceAllowed(ipAddress?: string | null) {
  if (!shouldEnforceZiinaWebhookIpAllowlist()) {
    return true
  }

  return getConfiguredWebhookIps().includes(normalizeIp(ipAddress))
}
