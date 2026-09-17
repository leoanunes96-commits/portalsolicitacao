"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PainelAdmin } from "@/components/painel-admin"

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Administração de Solicitações
          </h1>
          <p className="mt-2 text-muted-foreground">
            Todas as solicitações recebidas, separadas por tipo. Atualize o status
            do ticket, registre observações ou exclua uma solicitação.
          </p>
        </div>

        <PainelAdmin />
      </div>
    </main>
  )
}
