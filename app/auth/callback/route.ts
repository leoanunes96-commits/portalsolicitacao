import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Troca o "code" (fluxo PKCE) que o Supabase Auth manda nos links de e-mail
// (confirmação de cadastro e recuperação de senha) por uma sessão de verdade,
// gravada nos cookies via lib/supabase/server. Sem essa rota, os links
// enviados por e-mail não completam o login/redefinição.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`)
}
