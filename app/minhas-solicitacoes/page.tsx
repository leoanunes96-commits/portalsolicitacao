"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PainelSolicitacoes } from "@/components/painel-solicitacoes"

export default function MinhasSolicitacoesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Minhas Solicitações
          </h1>
          <p className="mt-2 text-muted-foreground">
            Informe o e-mail usado ao abrir a solicitação para acompanhar o status.
            Como o login institucional ainda não foi implementado, a consulta é feita
            pelo e-mail informado, não por uma conta autenticada.
          </p>
        </div>

        <PainelSolicitacoes />
      </div>
    </main>
  )
}
