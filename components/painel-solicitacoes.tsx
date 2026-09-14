"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"

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
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[] | null>(null)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setErro(null)

    try {
      const response = await fetch(`/api/solicitacoes?email=${encodeURIComponent(email)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao consultar solicitações")
      }

      setSolicitacoes(result.solicitacoes)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao consultar solicitações")
      setSolicitacoes(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={buscar} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel htmlFor="email-painel">E-mail usado na solicitação</FieldLabel>
          <Input
            id="email-painel"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={isLoading} className="sm:mb-0">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar
        </Button>
      </form>

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      {solicitacoes && solicitacoes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma solicitação encontrada para este e-mail.
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
