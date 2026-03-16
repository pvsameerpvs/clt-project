import * as dotenv from 'dotenv'
dotenv.config()
import { supabaseAdmin } from './src/config/supabase'

async function checkEverything() {
  console.log('--- Database Check ---')
  
  const { data: catData } = await supabaseAdmin.from('categories').select('id, name, slug')
  console.log('Categories:', catData?.length || 0)
  catData?.forEach(c => console.log(`- ${c.slug} (${c.name})`))

  const { data: prodData } = await supabaseAdmin.from('products').select('id, name, slug')
  console.log('Products:', prodData?.length || 0)
  prodData?.forEach(p => console.log(`- ${p.slug} (${p.name})`))
  
  const { data: setsData } = await supabaseAdmin.from('site_settings').select('id')
  console.log('Site Settings rows:', setsData?.length || 0)
}

checkEverything()
