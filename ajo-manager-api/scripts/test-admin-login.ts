import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
)

async function test() {
  const phone = '+2347033139259'
  const password = 'AjopotAdmin2024!'

  console.log('Testing signInWithPassword...')
  console.log('Phone:', phone)

  const { data, error } = await client.auth.signInWithPassword({ phone, password })

  if (error) {
    console.log('FAILED:', error.message, '| code:', error.code)
  } else {
    console.log('SUCCESS! User id:', data.user?.id)
    await client.auth.signOut()
  }
}

test().catch(console.error)
