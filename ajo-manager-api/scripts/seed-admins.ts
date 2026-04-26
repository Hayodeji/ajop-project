/**
 * One-time script to create super-admin accounts in Supabase.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/seed-admins.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMINS = [
  { phone: '+2349065543761', password: 'Ajopot_123*#,' },
  { phone: '+2347033139259', password: 'Ajopot_123*#,' },
]

async function seedAdmins() {
  console.log('Creating super-admin accounts...\n')

  for (const { phone, password } of ADMINS) {
    const { data, error } = await admin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
    })

    if (error) {
      console.error(`✗ Failed to create ${phone}:`, error.message)
    } else {
      console.log(`✓ Created ${phone} (id: ${data.user?.id})`)
    }
  }

  console.log('\nDone. Super-admins can now log in at /admin/login')
}

seedAdmins().catch(console.error)
