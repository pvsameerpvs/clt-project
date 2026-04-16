import { Router, Request, Response } from 'express'
import { sendWelcomeEmail } from '../services/email.service'
import { supabaseAdmin } from '../config/supabase'

export const authRoutes = Router()

async function findAuthUserByEmail(email: string) {
  let page = 1
  const perPage = 200
  const normalizedEmail = email.toLowerCase()

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw error
    }

    const users = data.users || []
    const matchedUser = users.find(
      (user) => (user.email || '').toLowerCase() === normalizedEmail
    )

    if (matchedUser) {
      return matchedUser
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function ensureProfileRow(user: {
  id: string
  user_metadata?: Record<string, unknown> | null
}) {
  const metadata = user.user_metadata || {}

  const firstName =
    typeof metadata.first_name === 'string' ? metadata.first_name : ''
  const lastName =
    typeof metadata.last_name === 'string' ? metadata.last_name : ''
  const avatarUrl =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : ''

  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' }
  )

  if (error) {
    throw error
  }
}

authRoutes.post('/signup', async (req: Request, res: Response) => {
  try {
    const firstName =
      typeof req.body?.firstName === 'string' ? req.body.firstName.trim() : ''
    const lastName =
      typeof req.body?.lastName === 'string' ? req.body.lastName.trim() : ''
    const email =
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password =
      typeof req.body?.password === 'string' ? req.body.password : ''

    if (!email || !email.includes('@') || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const existingUser = await findAuthUserByEmail(email)

    if (existingUser) {
      const providers = Array.from(
        new Set(
          [
            ...(existingUser.app_metadata?.providers || []),
            existingUser.app_metadata?.provider,
            ...(existingUser.identities?.map((identity) => identity.provider) || []),
          ].filter((provider): provider is string => Boolean(provider))
        )
      )

      if (providers.includes('google') && !providers.includes('email')) {
        res.status(409).json({
          error:
            'This email is already registered with Google. Please use Continue with Google on the login page.',
        })
        return
      }

      const isEmailConfirmed = Boolean(
        existingUser.email_confirmed_at || existingUser.confirmed_at
      )

      if (isEmailConfirmed) {
        res.status(409).json({
          error: 'This email is already registered. Please log in instead.',
        })
        return
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
          },
        }
      )

      if (error || !data.user) {
        res.status(500).json({
          error: error?.message || 'We could not activate this account right now.',
        })
        return
      }

      await ensureProfileRow(data.user)

      res.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
        },
      })
      return
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (error || !data.user) {
      res.status(500).json({
        error: error?.message || 'We could not create your account right now.',
      })
      return
    }

    await ensureProfileRow(data.user)

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata || {},
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Signup failed' })
  }
})

authRoutes.post('/welcome-email', async (req: Request, res: Response) => {
  try {
    const { email, firstName, source } = req.body || {}

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' })
      return
    }

    await sendWelcomeEmail({
      email,
      firstName: typeof firstName === 'string' ? firstName : '',
      source: source === 'google' ? 'google' : 'signup',
    })

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send welcome email' })
  }
})
