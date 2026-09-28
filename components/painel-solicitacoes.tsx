"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type StatusSolicitacao =
  | "RECEBIDO"
  | "EM_ANALISE"
  | "DILIGENCIA_PENDENTE"
  | "DEFERIDO"
  | "INDEFERIDO"
type TipoFluxo = "AJUSTE_MATRICULA" | "QUEBRA_PRE_REQUISITO" | "ATESTADO_MEDICO"

interface HistoricoStatus {
  id: string
  statusAnterior: StatusSolicitacao | null
  statusNovo: StatusSolicitacao
  alteradoEm: string
  observacao: string | null
}

interface Solicitacao {
  id: string
  tipoFluxo: TipoFluxo
  statusSolicitacao: StatusSolicitacao
  nomeCompleto: string
  criadoEm: string
  // Dados específicos de cada fluxo (ver prisma/schema.prisma) - usado aqui só
  // para compor o título com o tipo de ajuste de matrícula solicitado.
  dadosEspecificos?: { tipoSolicitacao?: "abertura_vaga" | "abertura_escopo" } | null
  historico: HistoricoStatus[]
}

const TIPO_FLUXO_LABEL: Record<TipoFluxo, string> = {
  AJUSTE_MATRICULA: "Ajuste de Matrícula",
  QUEBRA_PRE_REQUISITO: "Quebra de Pré-Requisito",
  ATESTADO_MEDICO: "Atestado Médico / Segunda Chamada",
}

// Só o fluxo de Ajuste de Matrícula tem um "subtipo" (vaga ou escopo) que faz
// sentido aparecer já no título do card, para o discente identificar de
// imediato qual das duas coisas ele pediu sem precisar abrir a solicitação.
const TIPO_SOLICITACAO_LABEL: Record<string, string> = {
  abertura_vaga: "Abertura de Vaga",
  abertura_escopo: "Abertura de Escopo",
}

function tituloSolicitacao(s: Solicitacao) {
  const base = TIPO_FLUXO_LABEL[s.tipoFluxo]
  const subtipo = s.dadosEspecificos?.tipoSolicitacao
    ? TIPO_SOLICITACAO_LABEL[s.dadosEspecificos.tipoSolicitacao]
    : null
  return subtipo ? `${base} - ${subtipo}` : base
}

const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  RECEBIDO: "Recebido",
  EM_ANALISE: "Em análise",
  DILIGENCIA_PENDENTE: "Diligência pendente",
  DEFERIDO: "Deferido",
  INDEFERIDO: "Indeferido",
}

// Cores por status - combinadas com o painel administrativo para o
// significado de cada cor ser sempre o mesmo: tons claros com letra escura
// para status ainda em andamento, tons escuros com letra branca para as
// decisões finais (deferido/indeferido).
const STATUS_CLASSNAME: Record<StatusSolicitacao, string> = {
  RECEBIDO: "border-green-300 bg-green-100 text-black",
  EM_ANALISE: "border-yellow-300 bg-yellow-200 text-black",
  DILIGENCIA_PENDENTE: "border-red-300 bg-red-100 text-black",
  DEFERIDO: "border-green-800 bg-green-700 text-white",
  INDEFERIDO: "border-red-800 bg-red-700 text-white",
}

const STATUS_ICON: Record<StatusSolicitacao, typeof Inbox> = {
  RECEBIDO: Inbox,
  EM_ANALISE: Search,
  DILIGENCIA_PENDENTE: AlertTriangle,
  DEFERIDO: CheckCircle2,
  INDEFERIDO: XCircle,
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PainelSolicitacoes() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [emailLogado, setEmailLogado] = useState<string | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[] | null>(null)

  const buscar = useCallback(async () => {
    setIsLoading(true)
    setErro(null)

    try {
      const response = await fetch("/api/solicitacoes")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao consultar solicitações")
      }

      setSolicitacoes(result.solicitacoes)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao consultar solicitações")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then((result) => setEmailLogado(result.data.user?.email ?? null))

    buscar()
  }, [buscar])

  const sair = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {emailLogado ? `Conectado(a) como ${emailLogado}` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={buscar}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={sair} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {isLoading && solicitacoes === null && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando suas solicitações...
        </div>
      )}

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      {!isLoading && solicitacoes && solicitacoes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Você ainda não tem solicitações registradas.
        </p>
      )}

      {solicitacoes && solicitacoes.length > 0 && (
        <div className="space-y-4">
          {solicitacoes.map((solicitacao) => {
            const StatusIcon = STATUS_ICON[solicitacao.statusSolicitacao]
            return (
              <Card key={solicitacao.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{tituloSolicitacao(solicitacao)}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${STATUS_CLASSNAME[solicitacao.statusSolicitacao]}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {STATUS_LABEL[solicitacao.statusSolicitacao]}
                    </Badge>
                  </div>
                  <CardDescription>
                    Aberta em {formatarData(solicitacao.criadoEm)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 border-l border-border pl-4 text-sm">
                    {solicitacao.historico.map((item) => (
                      <li key={item.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_CLASSNAME[item.statusNovo]}`}
                          >
                            {STATUS_LABEL[item.statusNovo]}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatarData(item.alteradoEm)}
                          </span>
                        </div>
                        {item.observacao && (
                          <p className="mt-1 flex items-start gap-1.5 rounded-md bg-muted/50 p-2 text-muted-foreground">
                            <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            <span>{item.observacao}</span>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
