"use client"

import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CriarContaForm } from "@/components/criar-conta-form"

export default function CriarContaPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Suspense>
          <CriarContaForm />
        </Suspense>
      </div>
    </main>
  )
}
