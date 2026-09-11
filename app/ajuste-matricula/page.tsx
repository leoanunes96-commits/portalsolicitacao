"use client"

import Link from "next/link"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AjusteMatriculaForm } from "@/components/ajuste-matricula-form"

export default function AjusteMatriculaPage() {
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
              <h1 className="text-xl font-semibold text-foreground">Colegiado de Curso</h1>
              <p className="text-sm text-muted-foreground">Instituição Pública Federal de Ensino Superior</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Ajuste de Matrícula
          </h2>
          <p className="mt-2 text-muted-foreground">
            Preencha o formulário abaixo para solicitar abertura de vaga em disciplina lotada (ou, se for o caso, abertura de escopo).
          </p>
        </div>

        <AjusteMatriculaForm />
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Colegiado de Curso de Graduação
          </p>
        </div>
      </footer>
    </main>
  )
}
