"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "sonner"

import { Button } from "@/components/ui/button"
import { QuebraPreRequisitoForm } from "@/components/quebra-pre-requisito-form"

export default function QuebraPreRequisitoPage() {
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
            Quebra de Pré-Requisito
          </h1>
          <p className="mt-2 text-muted-foreground">
            Solicite a quebra de pré-requisito de uma disciplina, informando a justificativa e
            anexando o formulário de solicitação assinado (e, se tiver, o histórico parcial).
          </p>
        </div>

        <QuebraPreRequisitoForm />
      </div>

      <Toaster position="top-center" richColors />
    </main>
  )
}
