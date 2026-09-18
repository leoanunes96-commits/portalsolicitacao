// Client do Supabase Auth para uso em Server Components, Route Handlers e
// Middleware - lê/escreve a sessão nos cookies da requisição.
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // "set" chamado a partir de um Server Component: pode ser ignorado
            // com segurança se o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  )
}

export type { CookieOptions }
