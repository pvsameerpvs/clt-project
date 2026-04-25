import { Router, Request, Response } from 'express'
import { optionalAuthMiddleware } from '../middleware/auth.middleware'
import { CheckoutValidationError, validatePromoCodeForUser } from '../services/checkout.service'

export const promoCodeRoutes = Router()

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

promoCodeRoutes.post('/validate', optionalAuthMiddleware, async (req: Request, res: Response) => {
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

    const result = await validatePromoCodeForUser(normalizedCode, subtotal, req.user?.id || null)
    const finalTotal = Math.round(Math.max(0, subtotal - result.promoDiscount) * 100) / 100

    res.json({
      valid: true,
      code: result.promoCode || normalizedCode,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountAmount: result.promoDiscount,
      finalTotal,
      message: 'Promo applied',
    })
  } catch (error: any) {
    const statusCode = error instanceof CheckoutValidationError ? 400 : 500
    res.status(statusCode).json({
      valid: false,
      message: error?.message || 'Failed to validate promo code',
    })
  }
})
