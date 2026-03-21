import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const promoCodeRoutes = Router()

type PromoCodeRow = {
  code: string
  discount_type: 'percentage' | 'fixed' | string
  discount_value: number | string
  active?: boolean | null
  expires_at?: string | null
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundCurrency(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100
}

promoCodeRoutes.post('/validate', async (req: Request, res: Response) => {
  try {
    const rawCode = String(req.body?.code || '').trim()
    const normalizedCode = rawCode.toUpperCase()
    const subtotal = Math.max(0, toNumber(req.body?.subtotal))

    if (!normalizedCode) {
      res.status(400).json({
        valid: false,
        message: 'Enter promo code',
      })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .ilike('code', normalizedCode)
      .limit(1)

    if (error) throw error

    const promo = (data?.[0] || null) as PromoCodeRow | null
    if (!promo) {
      res.status(404).json({
        valid: false,
        message: 'Invalid promo code',
      })
      return
    }

    if (promo.active === false) {
      res.status(400).json({
        valid: false,
        message: 'Promo code is inactive',
      })
      return
    }

    if (promo.expires_at) {
      const expiresAt = new Date(promo.expires_at).getTime()
      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        res.status(400).json({
          valid: false,
          message: 'Promo code has expired',
        })
        return
      }
    }

    const discountType = promo.discount_type === 'fixed' ? 'fixed' : 'percentage'
    let discountValue = toNumber(promo.discount_value)

    if (discountType === 'percentage') {
      discountValue = Math.min(100, Math.max(0, discountValue))
    } else {
      discountValue = Math.max(0, discountValue)
    }

    const discountAmount = roundCurrency(
      discountType === 'percentage'
        ? (subtotal * discountValue) / 100
        : Math.min(discountValue, subtotal)
    )
    const finalTotal = roundCurrency(subtotal - discountAmount)

    res.json({
      valid: true,
      code: normalizedCode,
      discountType,
      discountValue,
      discountAmount,
      finalTotal,
      message: 'Promo applied',
    })
  } catch (error: any) {
    res.status(500).json({
      valid: false,
      message: error?.message || 'Failed to validate promo code',
    })
  }
})
