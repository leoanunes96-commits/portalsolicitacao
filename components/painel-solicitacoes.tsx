"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type StatusSolicitacao = "RECEBIDO" | "EM_ANALISE" | "DEFERIDO" | "INDEFERIDO"
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
  historico: HistoricoStatus[]
}

const TIPO_FLUXO_LABEL: Record<TipoFluxo, string> = {
  AJUSTE_MATRICULA: "Ajuste de Matrícula",
  QUEBRA_PRE_REQUISITO: "Quebra de Pré-Requisito",
  ATESTADO_MEDICO: "Atestado Médico / Segunda Chamada",
}

const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  RECEBIDO: "Recebido",
  EM_ANALISE: "Em análise",
  DEFERIDO: "Deferido",
  INDEFERIDO: "Indeferido",
}

const STATUS_CLASSNAME: Record<StatusSolicitacao, string> = {
  RECEBIDO: "",
  EM_ANALISE: "",
  DEFERIDO: "border-green-300 bg-green-50 text-green-700",
  INDEFERIDO: "border-destructive/40 text-destructive",
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

  useEffect(() => {
    const buscar = async () => {
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
    }

    const supabase = createClient()
    supabase.auth.getUser().then((result) => setEmailLogado(result.data.user?.email ?? null))

    buscar()
  }, [])

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
        <Button type="button" variant="ghost" size="sm" onClick={sair} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      {isLoading && (
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
          {solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {TIPO_FLUXO_LABEL[solicitacao.tipoFluxo]}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={STATUS_CLASSNAME[solicitacao.statusSolicitacao]}
                  >
                    {STATUS_LABEL[solicitacao.statusSolicitacao]}
                  </Badge>
                </div>
                <CardDescription>
                  Aberta em {formatarData(solicitacao.criadoEm)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1 border-l border-border pl-4 text-sm text-muted-foreground">
                  {solicitacao.historico.map((item) => (
                    <li key={item.id}>
                      {STATUS_LABEL[item.statusNovo]} — {formatarData(item.alteradoEm)}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
