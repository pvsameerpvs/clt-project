const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.")
  process.exit(1)
}

const email = String(process.argv[2] || "").trim().toLowerCase()
const newPassword = String(process.argv[3] || "")

if (!email || !newPassword) {
  console.error("Usage: npm run reset:password -- <email> <new-password>")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw error
    }

    const users = data.users || []
    const match = users.find((user) => String(user.email || "").trim().toLowerCase() === targetEmail)

    if (match) {
      return match
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function main() {
  const user = await findUserByEmail(email)

  if (!user) {
    console.error(`No Supabase auth user found for ${email}`)
    process.exit(1)
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) {
    throw error
  }

  console.log(`Password updated for ${email}`)
  console.log(`User ID: ${user.id}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
