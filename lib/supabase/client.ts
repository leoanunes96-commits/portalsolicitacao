// Client do Supabase Auth para uso em Client Components ("use client").
// Usa a chave pública (anon key) - segura para expor no navegador; o acesso
// real aos dados continua protegido pelas regras do Supabase e pelas rotas
// de API do próprio Next.js.
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
