import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

export const settingsRoutes = Router()

const EMPTY_SETTINGS = {
  hero_slides: [],
  ticker_text: "",
  pocket_friendly_configs: [],
  collections: [],
  brand_story: {
    title: "",
    description: "",
    image: "",
    features: [],
  },
  offers: [],
  navigation: {},
  global_store_info: {
    name: "",
    slogan: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    social_links: {
      instagram: "",
      facebook: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      tiktok: "",
    },
    social_links_enabled: {
      instagram: true,
      facebook: true,
      twitter: true,
      youtube: true,
      linkedin: true,
      tiktok: true,
    },
  },
}

// Public route to get site content
settingsRoutes.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.json(data || EMPTY_SETTINGS)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Protected admin route to update settings
settingsRoutes.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data: existing } = await supabaseAdmin.from('site_settings').select('id').single()
    let result
    if (existing) {
      result = await supabaseAdmin.from('site_settings').update(req.body).eq('id', existing.id).select().single()
    } else {
      result = await supabaseAdmin.from('site_settings').insert(req.body).select().single()
    }
    if (result.error) throw result.error
    res.json(result.data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})
