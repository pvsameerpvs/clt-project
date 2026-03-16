import * as dotenv from 'dotenv'
dotenv.config()
import { supabaseAdmin } from './src/config/supabase'

async function seedTestProduct() {
  console.log('--- Seeding Test Product ---')
  
  // 1. Get Category ID (Men's)
  const { data: catData } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('slug', 'mens')
    .single()

  if (!catData) {
    console.error('Men\'s category not found. Please create it in dashboard first with slug "mens"')
    return
  }

  // 2. Insert Product
  const testProduct = {
    category_id: catData.id,
    name: 'Moonlight Perfume',
    slug: 'moonlight-perfume',
    description: 'A luxurious night fragrance with notes of bergamot and oud.',
    price: 299,
    stock_quantity: 50,
    is_active: true,
    is_new: true,
    scent: 'Woody & Floral',
    images: ['/prfume-bannar-1.jpg'],
    top_notes: ['Bergamot', 'Lavender'],
    heart_notes: ['Rose', 'Geranium'],
    base_notes: ['Oud', 'Amber']
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(testProduct)
    .select()
    .single()

  if (error) {
    console.error('Error seeding product:', error.message)
    if (error.message.includes('unique constraint')) {
      console.log('Product already exists with this slug!')
    }
  } else {
    console.log('Success! Product seeded:', data.name)
    console.log('URL: http://localhost:3000/product/moonlight-perfume')
  }
}

seedTestProduct()
