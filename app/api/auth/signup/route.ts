import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emailPermitidoParaCadastro } from "@/lib/email-dominio"

// Cadastro de conta (Supabase Auth). Validar o domínio do e-mail aqui, do
// lado do servidor, é o que garante que só e-mails institucionais consigam
// criar conta pelo formulário da aplicação. Fica registrado como limitação
// conhecida: alguém com conhecimento técnico ainda poderia chamar a API do
// Supabase diretamente com a chave pública e pular essa validação - uma
// restrição de verdade exigiria configurar isso no próprio Supabase (Auth
// Hook), o que fica como melhoria futura quando o RNF1 for revisitado.
export async function POST(request: Request) {
  let body: { email?: string; senha?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const senha = body.senha

  if (!email || !senha) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 })
  }

  if (senha.length < 6) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 }
    )
  }

  if (!emailPermitidoParaCadastro(email)) {
    return NextResponse.json(
      { error: "Este e-mail não tem permissão para criar conta. Use seu e-mail institucional." },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password: senha })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Se a confirmação de e-mail estiver ativada no projeto Supabase,
  // data.session vem nulo até o link de confirmação ser clicado.
  return NextResponse.json({ precisaConfirmarEmail: !data.session })
}
