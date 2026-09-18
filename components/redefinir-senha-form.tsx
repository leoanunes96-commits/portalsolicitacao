"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, Loader2 } from "lucide-react"
import type { EmailOtpType } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"

export function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const redefinir = async (e: React.FormEvent) => {
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
    if (!tokenHash || !type) {
      setErro('Link inválido ou incompleto. Solicite um novo em "Esqueci minha senha".')
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    // De propósito, só consumimos o token do link (verifyOtp) aqui, dentro do
    // clique da pessoa - nunca automaticamente ao abrir a página. Muitos
    // provedores de e-mail (Outlook/Defender, por exemplo) "pré-visitam" links
    // recebidos para checar segurança; se a verificação rodasse já no
    // carregamento da página, esse acesso automático consumiria o link (que é
    // de uso único) antes da pessoa clicar de verdade.
    const { error: erroVerificacao } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (erroVerificacao) {
      setIsLoading(false)
      setErro(
        'Não foi possível validar o link. Ele pode ter expirado ou já ter sido usado - solicite um novo em "Esqueci minha senha".'
      )
      return
    }

    const { error } = await supabase.auth.updateUser({ password: senha })

    setIsLoading(false)

    if (error) {
      setErro(error.message || "Não foi possível salvar a nova senha. Tente novamente.")
      return
    }

    router.push("/login")
    router.refresh()
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Definir nova senha</CardTitle>
        <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={redefinir} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="nova-senha">Nova senha</FieldLabel>
            <Input
              id="nova-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmar-senha">Confirmar nova senha</FieldLabel>
            <Input
              id="confirmar-senha"
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Salvar nova senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
