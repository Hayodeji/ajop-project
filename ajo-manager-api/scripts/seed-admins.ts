/**
 * One-time script to create super-admin accounts in Supabase.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/seed-admins.ts
 */

import 'dotenv/config'
import { createClient, User } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMINS = [
  { phone: '+2349065543761', password: 'AjopotAdmin2024!' },
  { phone: '+2347033139259', password: 'AjopotAdmin2024!' },
]

async function seedAdmins() {
  console.log('Creating/updating super-admin accounts...\n')

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const userList = users as User[]

  for (const { phone, password } of ADMINS) {
    const existing = userList.find((u) => u.phone === phone || u.phone === phone.replace('+', ''))

    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, { password })
      if (error) console.error(`✗ Failed to update ${phone}:`, error.message)
      else console.log(`✓ Password updated for ${phone} (id: ${existing.id})`)
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        phone,
        password,
        phone_confirm: true,
      })
      if (error) console.error(`✗ Failed to create ${phone}:`, error.message)
      else console.log(`✓ Created ${phone} (id: ${data.user?.id})`)
    }
  }

  console.log('\nDone. Super-admins can now log in at /admin/login')
}

seedAdmins().catch(console.error)
