import { createServerClient } from '@supabase/ssr'
import { AUTH_SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/auth-errors'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (!isDashboardRoute) {
    return NextResponse.next({
      request,
    })
  }

  if (!hasSupabaseAuthCookie(request)) {
    return redirectToLogin(request)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[proxy] Missing Supabase public env vars.')
    return redirectToLogin(request, AUTH_SERVICE_UNAVAILABLE_MESSAGE)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      auth: {
        storageKey: process.env.NEXT_PUBLIC_AUTH_STORAGE_KEY,
      }
    }
  )

  let user = null
  let sessionLookupFailed = false

  try {
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    user = sessionUser
  } catch (error) {
    sessionLookupFailed = true
    console.error('[proxy] Failed to verify Supabase session.', error)
  }

  if (!user) {
    return redirectToLogin(
      request,
      sessionLookupFailed ? AUTH_SERVICE_UNAVAILABLE_MESSAGE : undefined
    )
  }

  return supabaseResponse
}

function hasSupabaseAuthCookie(request: NextRequest) {
  const storageKey = process.env.NEXT_PUBLIC_AUTH_STORAGE_KEY

  return request.cookies.getAll().some(({ name }) => {
    if (storageKey && (name === storageKey || name.startsWith(`${storageKey}.`))) {
      return true
    }

    return name.startsWith('sb-') && name.includes('auth-token')
  })
}

function redirectToLogin(request: NextRequest, error?: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  if (error) url.searchParams.set('error', error)
  else url.search = ''
  return NextResponse.redirect(url)
}
