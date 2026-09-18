import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarLoginAdmin } from "@/lib/admin-auth"
import type { StatusSolicitacao } from "@prisma/client"

// Valores aceitos para "Status do Ticket" na área administrativa - os mesmos
// do enum StatusSolicitacao do schema.
const STATUS_VALIDOS: StatusSolicitacao[] = ["RECEBIDO", "EM_ANALISE", "DEFERIDO", "INDEFERIDO"]

interface RouteParams {
  params: Promise<{ id: string }>
}

// Atualiza o status de uma solicitação e registra a mudança no histórico de
// auditoria (RNF3), numa única transação - ou as duas operações acontecem
// juntas, ou nenhuma acontece. Também aceita uma "observação" de texto livre
// para descrever a situação atual ou solicitar correção.
export async function PATCH(request: Request, { params }: RouteParams) {
  if (!verificarLoginAdmin(request)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados não configurado nesta instância." },
      { status: 503 }
    )
  }

  const { id } = await params

  let body: { statusNovo?: string; observacao?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const { statusNovo, observacao } = body

  if (!statusNovo || !STATUS_VALIDOS.includes(statusNovo as StatusSolicitacao)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  try {
    const solicitacaoAtual = await prisma.solicitacao.findUnique({ where: { id } })

    if (!solicitacaoAtual) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 })
    }

    const [, novoHistorico] = await prisma.$transaction([
      prisma.solicitacao.update({
        where: { id },
        data: { statusSolicitacao: statusNovo as StatusSolicitacao },
      }),
      prisma.historicoStatusSolicitacao.create({
        data: {
          solicitacaoId: id,
          statusAnterior: solicitacaoAtual.statusSolicitacao,
          statusNovo: statusNovo as StatusSolicitacao,
          observacao: observacao?.trim() || null,
        },
      }),
    ])

    return NextResponse.json({ historico: novoHistorico })
  } catch (error) {
    console.error("Erro ao atualizar solicitação (admin):", error)
    return NextResponse.json(
      { error: "Erro ao atualizar solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}

// Remove uma solicitação (operação de remoção exigida pelo Módulo 3),
// restrita à área administrativa. O histórico de status é removido em
// cascata (ver onDelete: Cascade em prisma/schema.prisma).
export async function DELETE(request: Request, { params }: RouteParams) {
  if (!verificarLoginAdmin(request)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados não configurado nesta instância." },
      { status: 503 }
    )
  }

  const { id } = await params

  try {
    await prisma.solicitacao.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Erro ao excluir solicitação (admin):", error)
    return NextResponse.json(
      { error: "Erro ao excluir solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
