"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, LogIn, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"

type Modo = "entrar" | "cadastrar"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proximaRota = searchParams.get("next") || "/"

  const [modo, setModo] = useState<Modo>("entrar")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErro(null)
    setMensagem(null)

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

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErro(null)
    setMensagem(null)

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

      if (result.precisaConfirmarEmail) {
        setMensagem("Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.")
        setModo("entrar")
      } else {
        router.push(proximaRota)
        router.refresh()
        return
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar conta.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <div className="mb-2 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={modo === "entrar" ? "default" : "outline"}
            onClick={() => {
              setModo("entrar")
              setErro(null)
              setMensagem(null)
            }}
            className="flex-1 gap-2"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={modo === "cadastrar" ? "default" : "outline"}
            onClick={() => {
              setModo("cadastrar")
              setErro(null)
              setMensagem(null)
            }}
            className="flex-1 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Criar conta
          </Button>
        </div>
        <CardTitle className="text-base">
          {modo === "entrar" ? "Entrar em Minhas Solicitações" : "Criar conta"}
        </CardTitle>
        <CardDescription>
          {modo === "entrar"
            ? "Use o e-mail e a senha da sua conta institucional."
            : "O cadastro é restrito a e-mails institucionais."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={modo === "entrar" ? entrar : cadastrar} className="space-y-4">
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
          {mensagem && (
            <p className="text-sm text-green-700" role="status">
              {mensagem}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
