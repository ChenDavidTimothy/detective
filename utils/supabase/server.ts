import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CookieOptions } from '@supabase/ssr'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore: Server Components can't set cookies directly
          }
        },
      },
      global: {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
        }
      }
    }
  )
}