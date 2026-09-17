"use client"

import { useEffect, useState } from "react"
import { Loader2, Lock, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  matricula: string | null
  telefone: string | null
  email: string
  criadoEm: string
  historico: HistoricoStatus[]
}

const TIPO_FLUXO_LABEL: Record<TipoFluxo, string> = {
  AJUSTE_MATRICULA: "Ajuste de Matrícula",
  QUEBRA_PRE_REQUISITO: "Quebra de Pré-Requisito",
  ATESTADO_MEDICO: "Atestado Médico / Segunda Chamada",
}

const TIPO_FLUXO_ORDEM: TipoFluxo[] = ["AJUSTE_MATRICULA", "QUEBRA_PRE_REQUISITO", "ATESTADO_MEDICO"]

const STATUS_LABEL: Record<StatusSolicitacao, string> = {
  RECEBIDO: "Recebido",
  EM_ANALISE: "Em análise",
  DEFERIDO: "Deferido",
  INDEFERIDO: "Indeferido",
}

const STATUS_OPCOES: StatusSolicitacao[] = ["RECEBIDO", "EM_ANALISE", "DEFERIDO", "INDEFERIDO"]

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

// Guarda o código de admin só nesta aba/sessão do navegador (nunca em
// localStorage persistente) - é um substituto temporário de login (RNF1),
// não deve parecer uma sessão "de verdade".
const CHAVE_SESSION_STORAGE = "portal-admin-codigo"

export function PainelAdmin() {
  const [codigo, setCodigo] = useState("")
  const [codigoConfirmado, setCodigoConfirmado] = useState<string | null>(null)
  const [erroAcesso, setErroAcesso] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[] | null>(null)
  const [tipoAtivo, setTipoAtivo] = useState<TipoFluxo>("AJUSTE_MATRICULA")

  // Rascunhos de edição (status/observação) por id de solicitação, antes de salvar.
  const [rascunhos, setRascunhos] = useState<Record<string, { status: StatusSolicitacao; observacao: string }>>({})
  const [salvandoId, setSalvandoId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  useEffect(() => {
    const salvo = sessionStorage.getItem(CHAVE_SESSION_STORAGE)
    if (salvo) {
      setCodigoConfirmado(salvo)
    }
  }, [])

  const buscarSolicitacoes = async (codigoParaUsar: string) => {
    setIsLoading(true)
    setErro(null)

    try {
      const response = await fetch("/api/admin/solicitacoes", {
        headers: { "x-admin-code": codigoParaUsar },
      })
      const result = await response.json()

      if (response.status === 401) {
        // Código errado: limpa a sessão e volta para a tela de acesso.
        sessionStorage.removeItem(CHAVE_SESSION_STORAGE)
        setCodigoConfirmado(null)
        setErroAcesso("Código de acesso incorreto.")
        return
      }

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

  useEffect(() => {
    if (codigoConfirmado) {
      buscarSolicitacoes(codigoConfirmado)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoConfirmado])

  const entrar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo) return
    setErroAcesso(null)
    sessionStorage.setItem(CHAVE_SESSION_STORAGE, codigo)
    setCodigoConfirmado(codigo)
  }

  const rascunhoDe = (s: Solicitacao) =>
    rascunhos[s.id] ?? { status: s.statusSolicitacao, observacao: "" }

  const atualizarRascunho = (id: string, campo: "status" | "observacao", valor: string) => {
    setRascunhos((atual) => ({
      ...atual,
      [id]: {
        status: (campo === "status" ? valor : atual[id]?.status) as StatusSolicitacao,
        observacao: campo === "observacao" ? valor : atual[id]?.observacao ?? "",
      },
    }))
  }

  const salvar = async (s: Solicitacao) => {
    if (!codigoConfirmado) return
    const rascunho = rascunhoDe(s)
    setSalvandoId(s.id)
    setErro(null)

    try {
      const response = await fetch(`/api/admin/solicitacoes/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-code": codigoConfirmado },
        body: JSON.stringify({ statusNovo: rascunho.status, observacao: rascunho.observacao }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar alteração")
      }

      await buscarSolicitacoes(codigoConfirmado)
      setRascunhos((atual) => {
        const { [s.id]: _removido, ...resto } = atual
        return resto
      })
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar alteração")
    } finally {
      setSalvandoId(null)
    }
  }

  const excluir = async (s: Solicitacao) => {
    if (!codigoConfirmado) return
    const confirmar = window.confirm(
      `Excluir permanentemente a solicitação de ${s.nomeCompleto}? Esta ação não pode ser desfeita.`
    )
    if (!confirmar) return

    setExcluindoId(s.id)
    setErro(null)

    try {
      const response = await fetch(`/api/admin/solicitacoes/${s.id}`, {
        method: "DELETE",
        headers: { "x-admin-code": codigoConfirmado },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Erro ao excluir solicitação")
      }

      await buscarSolicitacoes(codigoConfirmado)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao excluir solicitação")
    } finally {
      setExcluindoId(null)
    }
  }

  // Tela de acesso: pede o código de admin antes de mostrar qualquer dado.
  if (!codigoConfirmado) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Acesso restrito
          </CardTitle>
          <CardDescription>
            Informe o código de acesso administrativo para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="codigo-admin">Código de acesso</FieldLabel>
              <Input
                id="codigo-admin"
                type="password"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
              />
            </Field>
            {erroAcesso && (
              <p className="text-sm text-destructive" role="alert">
                {erroAcesso}
              </p>
            )}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const porTipo = (tipo: TipoFluxo) => (solicitacoes ?? []).filter((s) => s.tipoFluxo === tipo)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {TIPO_FLUXO_ORDEM.map((tipo) => (
            <Button
              key={tipo}
              type="button"
              variant={tipoAtivo === tipo ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoAtivo(tipo)}
            >
              {TIPO_FLUXO_LABEL[tipo]} ({porTipo(tipo).length})
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => buscarSolicitacoes(codigoConfirmado)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {erro && (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      )}

      {solicitacoes === null && isLoading && (
        <p className="text-sm text-muted-foreground">Carregando solicitações...</p>
      )}

      {solicitacoes !== null && porTipo(tipoAtivo).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma solicitação de {TIPO_FLUXO_LABEL[tipoAtivo]} até o momento.
        </p>
      )}

      <div className="space-y-4">
        {porTipo(tipoAtivo).map((s) => {
          const rascunho = rascunhoDe(s)
          return (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{s.nomeCompleto}</CardTitle>
                  <Badge variant="outline" className={STATUS_CLASSNAME[s.statusSolicitacao]}>
                    {STATUS_LABEL[s.statusSolicitacao]}
                  </Badge>
                </div>
                <CardDescription>
                  {s.email}
                  {s.matricula ? ` · Matrícula ${s.matricula}` : ""}
                  {s.telefone ? ` · ${s.telefone}` : ""} · Aberta em {formatarData(s.criadoEm)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                  <Field>
                    <FieldLabel htmlFor={`status-${s.id}`}>Status do ticket</FieldLabel>
                    {/* select nativo (não o Select do Radix) - propositalmente simples,
                        para evitar repetir o problema de interatividade que tivemos
                        com o RadioGroup do Radix. */}
                    <select
                      id={`status-${s.id}`}
                      value={rascunho.status}
                      onChange={(e) => atualizarRascunho(s.id, "status", e.target.value)}
                      className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {STATUS_OPCOES.map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {STATUS_LABEL[opcao]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`obs-${s.id}`}>
                      Observação (descreva a situação ou solicite correção)
                    </FieldLabel>
                    <Textarea
                      id={`obs-${s.id}`}
                      value={rascunho.observacao}
                      onChange={(e) => atualizarRascunho(s.id, "observacao", e.target.value)}
                      placeholder="Ex.: falta anexar comprovante; aguardando parecer do docente..."
                      rows={2}
                    />
                  </Field>
                </div>

                {s.historico.length > 0 && (
                  <ol className="space-y-1 border-l border-border pl-4 text-sm text-muted-foreground">
                    {s.historico.map((item) => (
                      <li key={item.id}>
                        {STATUS_LABEL[item.statusNovo]} — {formatarData(item.alteradoEm)}
                        {item.observacao ? `: "${item.observacao}"` : ""}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => salvar(s)}
                    disabled={salvandoId === s.id}
                  >
                    {salvandoId === s.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => excluir(s)}
                    disabled={excluindoId === s.id}
                  >
                    {excluindoId === s.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
