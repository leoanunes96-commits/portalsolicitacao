"use client"

import { useState } from "react"
import { Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErro(null)

    // O Supabase confere esse endereço contra a lista de "Redirect URLs"
    // configurada em Authentication -> URL Configuration, mesmo que o
    // template de e-mail (Authentication -> Email Templates -> "Reset
    // Password") aponte direto para /redefinir-senha com token_hash na URL,
    // em vez de usar {{ .RedirectTo }}.
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    setIsLoading(false)

    if (error) {
      setErro("Não foi possível enviar o e-mail agora. Tente novamente em instantes.")
      return
    }

    // O Supabase não informa se o e-mail existe ou não na base - mostramos a
    // mesma mensagem de sucesso nos dois casos, para não expor quais e-mails
    // têm conta cadastrada (evita enumeração de contas).
    setEnviado(true)
  }

  if (enviado) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Verifique seu e-mail</CardTitle>
          <CardDescription>
            Se <span className="font-medium text-foreground">{email}</span> estiver cadastrado, você vai
            receber um e-mail com um link para definir uma nova senha.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Esqueci minha senha</CardTitle>
        <CardDescription>
          Informe o e-mail institucional cadastrado. Vamos enviar um link para você definir uma nova
          senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email-recuperacao">E-mail institucional</FieldLabel>
            <Input
              id="email-recuperacao"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar link de recuperação
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
