require('dotenv').config()
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function run() {
  const phones = ['+2349065543761', '+2347033139259']
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  for (const phone of phones) {
    const user = users.find((u) => u.phone === phone || u.phone === phone.replace('+', ''))
    if (!user) { console.log('Not found:', phone); continue }
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: 'Ajopot_123*#,' })
    if (error) console.log('Error:', phone, error.message)
    else console.log('Password reset:', phone, '(id:', user.id + ')')
  }
}

run().catch(console.error)
