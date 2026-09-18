"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"

export function CriarContaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proximaRota = searchParams.get("next") || "/"

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.")
      return
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar conta.")
      }

      // Sempre volta para a tela de login (em vez de já abrir a aplicação
      // aqui) - é lá que a pessoa efetivamente entra, com uma mensagem de
      // sucesso adequada a cada caso (precisa confirmar e-mail ou não,
      // dependendo da configuração do projeto no Supabase).
      const status = result.precisaConfirmarEmail ? "confirmar-email" : "conta-criada"
      router.push(`/login?conta=${status}&next=${encodeURIComponent(proximaRota)}`)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar conta.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Criar conta</CardTitle>
        <CardDescription>O cadastro é restrito a e-mails institucionais.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={cadastrar} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email-cadastro">E-mail institucional</FieldLabel>
            <Input
              id="email-cadastro"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="senha-cadastro">Senha</FieldLabel>
            <Input
              id="senha-cadastro"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmar-senha-cadastro">Confirmar senha</FieldLabel>
            <Input
              id="confirmar-senha-cadastro"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              minLength={6}
              required
            />
          </Field>

          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar conta
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
