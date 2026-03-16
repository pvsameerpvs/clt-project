import * as dotenv from 'dotenv'
dotenv.config()
import { supabaseAdmin } from './src/config/supabase'

async function tryMinimalInsert() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: 'Test',
      slug: 'test-' + Date.now(),
      price: 10,
      stock_quantity: 1
    })
    .select()
  
  if (error) console.error('Insert error:', error)
  else console.log('Insert success:', data)
}

tryMinimalInsert()
