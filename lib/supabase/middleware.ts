// Renovação da sessão do Supabase Auth a cada requisição, e redirecionamento
// para /login em toda a aplicação, exceto nos poucos caminhos que precisam
// ficar acessíveis sem sessão: a própria tela de login/cadastro, a rota de
// cadastro, o fluxo de recuperação de senha (solicitação, callback do link
// de e-mail e definição da nova senha), e a área administrativa (que usa uma
// conta fixa única à parte - ver lib/admin-auth.ts -, pensada para a equipe
// técnico-administrativa, não para discentes).
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PREFIXOS_PUBLICOS = [
  "/login",
  "/criar-conta",
  "/api/auth",
  "/esqueci-senha",
  "/redefinir-senha",
  "/auth/callback",
  "/auth/confirm",
  "/admin",
  "/api/admin",
]

function rotaEhPublica(pathname: string) {
  return PREFIXOS_PUBLICOS.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`)
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() (não getSession()) valida o token com o servidor do Supabase a
  // cada chamada - é o que a própria documentação do Supabase recomenda para
  // não confiar num cookie que pode ter sido adulterado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!rotaEhPublica(request.nextUrl.pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
