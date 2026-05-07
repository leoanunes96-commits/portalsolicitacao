"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Toaster } from "sonner"

import { Button } from "@/components/ui/button"
import { EnvioAtestadoForm } from "@/components/envio-atestado-form"

export default function EnvioAtestadoPage() {
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
            Envio de Atestado
          </h1>
          <p className="mt-2 text-muted-foreground">
            Envie seu atestado médico para os docentes responsáveis pelas disciplinas em que houve falta.
          </p>
        </div>

        <EnvioAtestadoForm />
      </div>

      <Toaster position="top-center" richColors />
    </main>
  )
}
