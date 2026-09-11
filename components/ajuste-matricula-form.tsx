"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  matricula: z.string().min(1, "Número de matrícula é obrigatório"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("E-mail inválido"),
  codigoDisciplina: z.string().min(1, "Código da disciplina é obrigatório"),
  nomeDisciplina: z.string().min(1, "Nome da disciplina é obrigatório"),
  turma: z.string().optional(),
  tipoSolicitacao: z.enum(["abertura_vaga", "abertura_escopo"], {
    required_error: "Selecione o tipo de solicitação",
  }),
})

type FormData = z.infer<typeof formSchema>

export function AjusteMatriculaForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const tipoSolicitacao = watch("tipoSolicitacao")

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/enviar-solicitacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar solicitação")
      }

      setIsSuccess(true)
      toast.success("Solicitação enviada com sucesso!")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-green-900">
              Solicitação Enviada!
            </h3>
            <p className="mb-6 max-w-md text-green-700">
              Sua solicitação de ajuste de matrícula foi enviada com sucesso para a coordenação. 
              Você receberá uma resposta por e-mail em breve.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informe seus dados para identificação</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nomeCompleto">
                Nome Completo <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="nomeCompleto"
                placeholder="Digite seu nome completo"
                {...register("nomeCompleto")}
                className={errors.nomeCompleto ? "border-destructive" : ""}
              />
              {errors.nomeCompleto && (
                <FieldDescription className="text-destructive">
                  {errors.nomeCompleto.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="matricula">
                Número de Matrícula <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="matricula"
                placeholder="Ex: 2021123456"
                {...register("matricula")}
                className={errors.matricula ? "border-destructive" : ""}
              />
              {errors.matricula && (
                <FieldDescription className="text-destructive">
                  {errors.matricula.message}
                </FieldDescription>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="telefone">
                  Telefone <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(27) 99999-9999"
                  {...register("telefone")}
                  className={errors.telefone ? "border-destructive" : ""}
                />
                {errors.telefone && (
                  <FieldDescription className="text-destructive">
                    {errors.telefone.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">
                  E-mail <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Disciplina</CardTitle>
          <CardDescription>Informe os dados da disciplina desejada</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="codigoDisciplina">
                  Código da Disciplina <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="codigoDisciplina"
                  placeholder="Ex: FON12345"
                  {...register("codigoDisciplina")}
                  className={errors.codigoDisciplina ? "border-destructive" : ""}
                />
                {errors.codigoDisciplina && (
                  <FieldDescription className="text-destructive">
                    {errors.codigoDisciplina.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="turma">Turma</FieldLabel>
                <Input
                  id="turma"
                  placeholder="Ex: 01"
                  {...register("turma")}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="nomeDisciplina">
                Nome da Disciplina <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="nomeDisciplina"
                placeholder="Ex: Anatomia Humana"
                {...register("nomeDisciplina")}
                className={errors.nomeDisciplina ? "border-destructive" : ""}
              />
              {errors.nomeDisciplina && (
                <FieldDescription className="text-destructive">
                  {errors.nomeDisciplina.message}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de Solicitação</CardTitle>
          <CardDescription>Selecione o tipo de ajuste desejado</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={tipoSolicitacao}
            onValueChange={(value) => setValue("tipoSolicitacao", value as "abertura_vaga" | "abertura_escopo")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="abertura_vaga" id="abertura_vaga" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="abertura_vaga" className="cursor-pointer font-medium">
                  Abertura de Vaga
                </Label>
                <p className="text-sm text-muted-foreground">
                  Solicite a abertura de vaga em uma disciplina com vagas esgotadas
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="abertura_escopo" id="abertura_escopo" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="abertura_escopo" className="cursor-pointer font-medium">
                  Abertura de Escopo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Solicite a inclusão de uma disciplina fora do seu escopo curricular
                </p>
              </div>
            </div>
          </RadioGroup>

          {errors.tipoSolicitacao && (
            <p className="mt-2 text-sm text-destructive">
              {errors.tipoSolicitacao.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Solicitação
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Campos marcados com <span className="text-destructive">*</span> são obrigatórios
      </p>
    </form>
  )
}
