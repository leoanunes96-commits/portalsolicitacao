import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Painel de status por solicitação (RF3). Login institucional (RNF1) ainda é
// mockado, então por ora o filtro é feito pelo e-mail informado pelo(a) discente,
// em vez de uma sessão autenticada — é o único campo comum aos três fluxos-piloto.
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados não configurado nesta instância." },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json(
      { error: "Informe o e-mail usado na solicitação." },
      { status: 400 }
    )
  }

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
