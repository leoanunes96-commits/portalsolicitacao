import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarLoginAdmin } from "@/lib/admin-auth"

// Área administrativa: lista TODAS as solicitações (de todos os discentes),
// sem filtro por e-mail — ao contrário de GET /api/solicitacoes, que é usado
// pela tela "Minhas Solicitações". Acesso restrito por código de admin
// temporário (ver lib/admin-auth.ts) até existir login institucional (RNF1).
export async function GET(request: Request) {
  if (!verificarLoginAdmin(request)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados não configurado nesta instância." },
      { status: 503 }
    )
  }

  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        historico: { orderBy: { alteradoEm: "asc" } },
      },
    })

    return NextResponse.json({ solicitacoes })
  } catch (error) {
    console.error("Erro ao consultar solicitações (admin):", error)
    return NextResponse.json(
      { error: "Erro ao consultar solicitações. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
