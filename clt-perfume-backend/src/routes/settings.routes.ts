import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

export const settingsRoutes = Router()

// Public route to get site content
settingsRoutes.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    const defaultSettings = {
      hero_slides: [
        { image: "/prfume-bannar-1.jpg", tagline: "ELEGANCE IN EVERY DROP", headline: "Unveil Your <br/> Inner Essence" },
        { image: "/prfume-bannar-3.jpg", tagline: "LIMITED EDITION", headline: "Ramadan <br/> Signature Scents" },
        { image: "/prfume-bannar-4.png", tagline: "MODERN CLASSICS", headline: "The Art of <br/> Fine Fragrance" }
      ],
      ticker_text: "FREE SHIPPING ON ALL ORDERS OVER 200 AED 🚚 SHOP OUR NEW ARRIVALS NOW!",
      pocket_friendly_configs: [49, 99, 149, 199, 299],
      collections: [
        { href: "/collections/mens", image: "/prfume-bannar-2.jpg", subtitle: "Bold & Sophisticated", title: "Signature Men's <br/> Fragrances", action: "Shop Collection" },
        { href: "/collections/womens", image: "/prfume-bannar-3.jpg", subtitle: "Graceful & Timeless", title: "Timeless Women's <br/> Collection", action: "Discover More" },
        { href: "/collections/deals", image: "/Philosophy.png", subtitle: "Limited Time Only", title: "Exclusive Gift Sets <br/> & Bundles", action: "View Offers" }
      ],
      brand_story: {
        title: "Crafted for the Discerning Individual",
        description: "A symphony of scents that transcends words. It is not just a perfume, but an extension of the ambition and authority of a true icon.",
        image: "/Philosophy.png",
        features: [
          { title: "Clean Formulas", text: "No heavy musk or sweetness. Just crisp, cool mineral finish." },
          { title: "Sustainable Sourcing", text: "Ingredients ethically harvested from around the globe." }
        ]
      },
      offers: [
        { title: "Signature Sets", description: "Curated collections of our finest scents, beautifully bundled and packaged.", action: "Shop Sets", href: "/signature-sets" },
        { title: "Personal Engraving", description: "Add a personalized engraving to your bottle, available on all 100ml flacons.", action: "Learn More", href: "/personal-engraving" },
        { title: "Complimentary Samples", description: "Receive two complimentary luxury miniatures with every online order.", action: "View Details", href: "/complimentary-samples" }
      ],
      navigation: {
        mens: {
          categories: [
            { name: "Men Perfumes", slug: "mens", subcategories: [] },
            { name: "Best Seller For Men", slug: "mens", subcategories: ["Top Rated", "Most Loved"] },
            { name: "Gift Sets For Men", slug: "mens", subcategories: ["Under 199 AED", "Premium Boxes"] },
            { name: "Arabic Perfume", slug: "mens", subcategories: ["Oud", "Amber"] },
            { name: "Niche Perfumes", slug: "mens", subcategories: ["Limited Edition"] }
          ],
          notes: [
            { name: "Woody", image: "/prfume-bannar-2.jpg" },
            { name: "Spicy", image: "/prfume-bannar-4.png" }
          ],
          banners: [
            { title: "NEW ARRIVALS", image: "/Philosophy.png" },
            { title: "SIGNATURE", image: "/prfume-bannar-1.jpg" }
          ]
        },
        womens: {
          categories: [
            { name: "Women Perfumes", slug: "womens", subcategories: [] },
            { name: "Best Seller For Women", slug: "womens", subcategories: ["Top Rated", "Trending"] },
            { name: "Gift Sets For Women", slug: "womens", subcategories: ["Under 199 AED", "Luxury Boxes"] },
            { name: "Cosmetics", slug: "womens", subcategories: ["Makeup", "Skincare"] },
            { name: "Body Mist", slug: "womens", subcategories: ["Everyday", "Travel"] }
          ],
          notes: [
            { name: "Fruity", image: "/prfume-bannar-3.jpg" },
            { name: "Floral", image: "/prfume-bannar-2.jpg" }
          ],
          banners: [
            { title: "BEST SELLERS", image: "/Philosophy.png" },
            { title: "GIFT SETS", image: "/prfume-bannar-4.png" }
          ]
        }
      },
      global_store_info: {
        name: "CLE PERFUMES",
        slogan: "CLE PERFUMES.",
        description: "Elevating the everyday with scents that define your presence. Discover the true essence of luxury with our original collections, crafted meticulously for the discerning individual.",
        email: "contact@cleperfumes.com",
        phone: "+971 50 123 4567",
        address: "Dubai, United Arab Emirates",
        social_links: {
          instagram: "https://instagram.com/cleperfumes",
          facebook: "https://facebook.com/cleperfumes",
          twitter: "https://twitter.com/cleperfumes",
          youtube: "https://youtube.com/cleperfumes",
          linkedin: "https://linkedin.com/company/cleperfumes"
        }
      }
    }

    res.json(data || defaultSettings)
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
