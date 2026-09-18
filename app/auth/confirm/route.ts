import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Rota para onde o link de e-mail do Supabase Auth deve apontar DIRETAMENTE
// (recuperação de senha e, se quiser trocar depois, confirmação de cadastro
// também) - ver instruções para configurar o template no painel do Supabase.
// Usa verifyOtp com o token_hash em vez de exchangeCodeForSession porque o
// template padrão do Supabase não gera um "code" de PKCE, e sim um token_hash
// verificado neste formato (é o padrão recomendado pela documentação do
// Supabase para apps Next.js com @supabase/ssr).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url))
}
