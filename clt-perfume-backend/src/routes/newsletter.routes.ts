import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

export const newsletterRoutes = Router()

// POST /api/newsletter/subscribe
newsletterRoutes.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' })
      return
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subs')
      .upsert({ email }, { onConflict: 'email' })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.json({ success: true, message: 'Subscribed successfully!' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})
