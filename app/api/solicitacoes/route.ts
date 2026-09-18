import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// Painel de status por solicitação (RF3). O e-mail usado para filtrar vem
// da sessão autenticada (Supabase Auth) - não é mais recebido como parâmetro
// da requisição, para que não seja possível consultar as solicitações de
// outra pessoa só sabendo o e-mail dela (gap de segurança que existia
// enquanto o RNF1/login institucional era mockado).
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados não configurado nesta instância." },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 })
  }

  const email = user.email.trim().toLowerCase()

  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { criadoEm: "desc" },
      include: {
        historico: { orderBy: { alteradoEm: "asc" } },
      },
    })

    return NextResponse.json({ solicitacoes })
  } catch (error) {
    console.error("Erro ao consultar solicitações:", error)
    return NextResponse.json(
      { error: "Erro ao consultar solicitações. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
