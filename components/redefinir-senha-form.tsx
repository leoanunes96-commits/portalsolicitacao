"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"

// null = ainda verificando o link, true = sessão de recuperação válida,
// false = link inválido/expirado.
type EstadoLink = boolean | null

export function RedefinirSenhaForm() {
  const router = useRouter()
  const [linkValido, setLinkValido] = useState<EstadoLink>(null)

  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // O link do e-mail de recuperação (template padrão do Supabase) traz a
    // sessão embutida na própria URL. O client do Supabase detecta isso
    // sozinho ao carregar a página e dispara o evento PASSWORD_RECOVERY
    // quando essa sessão temporária fica pronta - não precisamos extrair
    // nem verificar nenhum token manualmente.
    const { data: escuta } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") {
        setLinkValido(true)
      }
    })

    // Cobre o caso (raro) de a sessão já ter sido processada antes deste
    // componente montar e escutar o evento acima.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLinkValido((atual) => (atual === null ? true : atual))
      }
    })

    // Depois de um tempo razoável sem nenhuma confirmação, assume que o
    // link é inválido ou já expirou.
    const tempoLimite = setTimeout(() => {
      setLinkValido((atual) => (atual === null ? false : atual))
    }, 4000)

    return () => {
      escuta.subscription.unsubscribe()
      clearTimeout(tempoLimite)
    }
  }, [])

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

    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    setIsLoading(false)

    if (error) {
      setErro(error.message || "Não foi possível salvar a nova senha. Tente novamente.")
      return
    }

    router.push("/login?conta=senha-redefinida")
    router.refresh()
  }

  if (linkValido === false) {
    return (
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Link inválido ou expirado</CardTitle>
          <CardDescription>
            Esse link de redefinição não é mais válido. Solicite um novo em &quot;Esqueci minha
            senha&quot;.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Definir nova senha</CardTitle>
        <CardDescription>
          {linkValido === null ? "Validando seu link..." : "Escolha uma nova senha para sua conta."}
        </CardDescription>
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
              disabled={linkValido !== true}
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
              disabled={linkValido !== true}
            />
          </Field>

          {erro && (
            <p className="text-sm text-destructive" role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={isLoading || linkValido !== true}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Salvar nova senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
