"use client"

import Link from "next/link"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { EmissaoDeclaracaoForm } from "@/components/emissao-declaracao-form"

export default function EmissaoDeclaracaoPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Fonoaudiologia</h1>
              <p className="text-sm text-muted-foreground">Universidade Federal do Espírito Santo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Emissão de Declaração
          </h2>
          <p className="mt-2 text-muted-foreground">
            Preencha os dados abaixo para solicitar sua declaração de regularidade acadêmica
          </p>
        </div>

        <EmissaoDeclaracaoForm />
      </div>
    </main>
  )
}
