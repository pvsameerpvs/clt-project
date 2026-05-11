import axios from 'axios'

function getEnv(name: string): string | undefined {
  return process.env[name]
}

/**
 * Sends an admin push notification by calling the dashboard webhook.
 * This works alongside SQL triggers as a reliable, immediate delivery path.
 */
export async function notifyAdminPush(payload: {
  type: 'INSERT' | 'UPDATE'
  table: 'orders' | 'order_return_requests'
  record: Record<string, unknown>
  old_record?: Record<string, unknown> | null
}): Promise<{ success: boolean; message?: string }> {
  const webhookUrl = getEnv('ADMIN_PUSH_WEBHOOK_URL')
  const webhookSecret = getEnv('ADMIN_PUSH_WEBHOOK_SECRET')

  if (!webhookUrl) {
    console.log('[PushNotification] ADMIN_PUSH_WEBHOOK_URL not set; skipping direct push.')
    return { success: false, message: 'Webhook URL not configured' }
  }

  try {
    const { data } = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret ? { 'x-webhook-secret': webhookSecret } : {}),
      },
      timeout: 8000,
    })

    console.log('[PushNotification] Direct push delivered:', data)
    return { success: true, message: data?.message || 'Delivered' }
  } catch (err: any) {
    const message = err?.response?.data?.error || err?.message || 'Unknown error'
    console.error('[PushNotification] Direct push failed:', message)
    return { success: false, message }
  }
}
