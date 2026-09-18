"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, FileCheck, ScrollText, GraduationCap, SplitSquareVertical, ListChecks, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const services = [
  {
    title: "Ajuste de Matrícula",
    description: "Solicite abertura de vaga em disciplina lotada",
    icon: FileText,
    href: "/ajuste-matricula",
    available: true,
  },
  {
    title: "Quebra de Pré-Requisito",
    description: "Solicite a quebra de pré-requisito de uma disciplina",
    icon: SplitSquareVertical,
    href: "/quebra-pre-requisito",
    available: true,
  },
  {
    title: "Envio de Atestado",
    description: "Envie atestados médicos e pedidos de segunda chamada",
    icon: FileCheck,
    href: "/envio-atestado",
    available: true,
  },
  {
    title: "Emissão de Declaração",
    description: "Solicite declarações acadêmicas e comprovantes",
    icon: ScrollText,
    href: "/emissao-declaracao",
    available: false,
  },
]

export default function HomePage() {
  const router = useRouter()

  const sair = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Colegiado de Curso</h1>
              <p className="text-sm text-muted-foreground">Instituição Pública Federal de Ensino Superior</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/minhas-solicitacoes">
              <Button variant="outline" size="sm" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Minhas Solicitações
              </Button>
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={sair} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Portal de Solicitações
          </h2>
          <p className="mt-3 text-muted-foreground">
            Selecione o tipo de solicitação que deseja realizar
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon

            if (!service.available) {
              return (
                <Card
                  key={service.title}
                  className="relative overflow-hidden opacity-60 cursor-not-allowed"
                >
                  <div className="absolute right-3 top-3 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    Em breve
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2 text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            }

            return (
              <Link key={service.title} href={service.href}>
                <Card className="group h-full transition-all hover:border-primary hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary">
                      <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2 text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 font-medium text-foreground">Informações Importantes</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• As solicitações são processadas em até 5 dias úteis</li>
            <li>• Certifique-se de preencher todos os campos obrigatórios</li>
            <li>• Você receberá uma confirmação por e-mail após o envio</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Colegiado de Curso de Graduação
          </p>
        </div>
      </footer>
    </main>
  )
}
