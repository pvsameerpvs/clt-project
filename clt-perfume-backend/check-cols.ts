import * as dotenv from 'dotenv'
dotenv.config()
import { supabaseAdmin } from './src/config/supabase'

async function inspectTable() {
  const { data, error } = await supabaseAdmin.rpc('get_table_info', { t_name: 'products' })
  // If RPC doesn't exist, we can try a simple select
  const { data: cols, error: err2 } = await supabaseAdmin.from('products').select('*').limit(0)
  
  if (err2) {
    console.error('Table error:', err2)
  } else {
    console.log('Table exists. Column keys returned:', Object.keys(cols?.[0] || {}))
  }
}

inspectTable()
