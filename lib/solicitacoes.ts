import { prisma } from "@/lib/prisma"
import type { TipoFluxo } from "@prisma/client"

interface DadosRegistroSolicitacao {
  tipoFluxo: TipoFluxo
  nomeCompleto: string
  matricula?: string | null
  telefone?: string | null
  email: string
  dadosEspecificos: Record<string, unknown>
}

// Registra uma nova solicitação e a primeira linha do seu histórico de status
// (RECEBIDO), usadas para o painel de status (RF3) e para a auditoria de mudanças
// de status (RNF3). Se o banco não estiver configurado (DATABASE_URL ausente) ou a
// escrita falhar, a função retorna null em vez de lançar erro — o envio de e-mail
// (RF4), que é a notificação principal do fluxo hoje, não deve ser bloqueado por
// isso.
export async function registrarSolicitacao(dados: DadosRegistroSolicitacao) {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL não configurada - solicitação não foi persistida no banco")
    return null
  }

  try {
    const solicitacao = await prisma.solicitacao.create({
      data: {
        tipoFluxo: dados.tipoFluxo,
        nomeCompleto: dados.nomeCompleto,
        matricula: dados.matricula ?? null,
        telefone: dados.telefone ?? null,
        email: dados.email,
        dadosEspecificos: dados.dadosEspecificos as any,
        historico: {
          create: {
            statusAnterior: null,
            statusNovo: "RECEBIDO",
          },
        },
      },
    })
    return solicitacao
  } catch (error) {
    console.error("Erro ao registrar solicitação no banco:", error)
    return null
  }
}

// Marca que o e-mail de notificação (RF4) foi enviado com sucesso para a solicitação
// registrada. Também é best-effort: falhar aqui não deve derrubar a resposta da API.
export async function marcarEmailEnviado(solicitacaoId: string | undefined) {
  if (!solicitacaoId || !process.env.DATABASE_URL) return
  try {
    await prisma.solicitacao.update({
      where: { id: solicitacaoId },
      data: { emailNotificacaoEnviado: true },
    })
  } catch (error) {
    console.error("Erro ao marcar e-mail como enviado:", error)
  }
}
