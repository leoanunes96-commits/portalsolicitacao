"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, LogIn, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"

const MENSAGENS_CONTA: Record<string, string> = {
  "confirmar-email": "Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.",
  "conta-criada": "Conta criada com sucesso! Você já pode entrar.",
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proximaRota = searchParams.get("next") || "/"
  const mensagemConta = MENSAGENS_CONTA[searchParams.get("conta") ?? ""] ?? null

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErro(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro("E-mail ou senha incorretos.")
      setIsLoading(false)
      return
    }

    router.push(proximaRota)
    router.refresh()
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Entrar em Minhas Solicitações</CardTitle>
        <CardDescription>Use o e-mail e a senha da sua conta institucional.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={entrar} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email-login">E-mail institucional</FieldLabel>
            <Input
              id="email-login"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="senha-login">Senha</FieldLabel>
            <Input
              id="senha-login"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </Field>

          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}
          {mensagemConta && (
            <p className="text-sm text-green-700" role="status">
              {mensagemConta}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Entrar
          </Button>

          <Link href={`/criar-conta?next=${encodeURIComponent(proximaRota)}`}>
            <Button type="button" variant="outline" className="w-full gap-2">
              <UserPlus className="h-4 w-4" />
              Criar conta
            </Button>
          </Link>

          <Link
            href="/esqueci-senha"
            className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Esqueci minha senha
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
