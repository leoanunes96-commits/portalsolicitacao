"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send, CheckCircle, Upload, X, FileText, Info } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"
import {
  REGEX_MATRICULA,
  REGEX_TELEFONE,
  REGEX_CODIGO_DISCIPLINA,
  somenteNumeros,
  formatarCodigoDisciplina,
} from "@/lib/form-utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

// Sem campo de e-mail no formulário - o e-mail usado é sempre o da conta
// autenticada (login é obrigatório para chegar a este formulário), obtido
// direto da sessão do Supabase no momento do envio. Isso garante que toda
// solicitação aparece em "Minhas Solicitações" dessa mesma pessoa, sem
// depender de ela digitar (ou digitar errado) um e-mail à mão.
const formSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  matricula: z
    .string()
    .regex(REGEX_MATRICULA, "A matrícula deve conter exatamente 10 números"),
  telefone: z
    .string()
    .regex(REGEX_TELEFONE, "O telefone deve conter apenas números, entre 10 e 11 dígitos"),
  codigoDisciplina: z
    .string()
    .regex(
      REGEX_CODIGO_DISCIPLINA,
      "Código inválido. Use 3 letras seguidas de 5 números (ex.: FON12345)"
    ),
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
  const [emailSessao, setEmailSessao] = useState<string | null>(null)
  const [formularioFile, setFormularioFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // Registros dos campos com formatação restrita durante a digitação (só
  // números para matrícula/telefone, maiúsculas para o código da disciplina)
  // - guardados numa variável para poder encadear o onChange do react-hook-form
  // com o filtro de caracteres, sem perder a integração com o zod.
  const registroMatricula = register("matricula")
  const registroTelefone = register("telefone")
  const registroCodigoDisciplina = register("codigoDisciplina")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmailSessao(data.user?.email ?? null)
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setFileError("O arquivo deve ter no máximo 10MB")
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Formato inválido. Aceitos: PDF, JPG, PNG")
      return
    }

    setFileError(undefined)
    setFormularioFile(file)
  }

  const removeFile = () => setFormularioFile(null)

  const onSubmit = async (data: FormData) => {
    if (!formularioFile) {
      setFileError("O formulário preenchido e assinado é obrigatório")
      return
    }

    if (!emailSessao) {
      toast.error("Não foi possível identificar seu e-mail institucional. Recarregue a página e tente novamente.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("nomeCompleto", data.nomeCompleto)
      formData.append("matricula", data.matricula)
      formData.append("telefone", data.telefone)
      formData.append("email", emailSessao)
      formData.append("codigoDisciplina", data.codigoDisciplina)
      formData.append("nomeDisciplina", data.nomeDisciplina)
      formData.append("turma", data.turma ?? "")
      formData.append("tipoSolicitacao", data.tipoSolicitacao)
      formData.append("formulario", formularioFile)

      const response = await fetch("/api/enviar-solicitacao", {
        method: "POST",
        body: formData,
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
                inputMode="numeric"
                maxLength={10}
                {...registroMatricula}
                onChange={(e) => {
                  e.target.value = somenteNumeros(e.target.value, 10)
                  registroMatricula.onChange(e)
                }}
                className={errors.matricula ? "border-destructive" : ""}
              />
              {errors.matricula && (
                <FieldDescription className="text-destructive">
                  {errors.matricula.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="telefone">
                Telefone <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="telefone"
                type="tel"
                placeholder="27999999999"
                inputMode="numeric"
                maxLength={11}
                {...registroTelefone}
                onChange={(e) => {
                  e.target.value = somenteNumeros(e.target.value, 11)
                  registroTelefone.onChange(e)
                }}
                className={errors.telefone ? "border-destructive" : ""}
              />
              {errors.telefone && (
                <FieldDescription className="text-destructive">
                  {errors.telefone.message}
                </FieldDescription>
              )}
            </Field>

            <FieldDescription>
              As comunicações referentes a esta solicitação serão realizadas pelo e-mail
              institucional cadastrado. Fique atento(a) à sua caixa de entrada.
            </FieldDescription>
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
                  maxLength={8}
                  {...registroCodigoDisciplina}
                  onChange={(e) => {
                    e.target.value = formatarCodigoDisciplina(e.target.value)
                    registroCodigoDisciplina.onChange(e)
                  }}
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
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            Envie o formulário de solicitação preenchido (PDF, JPG ou PNG - máx. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-medium">O formulário precisa estar assinado.</span> A
                assinatura pode ser digital (ex.: gov.br ou outro assinador digital válido) ou
                física - neste último caso, envie uma foto legível do formulário impresso e
                assinado.
              </p>
            </div>

            <Field>
              <FieldLabel>
                Formulário Preenchido e Assinado <span className="text-destructive">*</span>
              </FieldLabel>
              {formularioFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{formularioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(formularioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Clique para selecionar</span>
                  <span className="text-xs text-muted-foreground">ou arraste o arquivo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
              )}
              {fileError && (
                <FieldDescription className="text-destructive">{fileError}</FieldDescription>
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
          <div className="space-y-3">
            <label className="flex items-start space-x-3 rounded-lg border-2 border-border p-4 transition-colors hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
              <input
                type="radio"
                value="abertura_vaga"
                {...register("tipoSolicitacao")}
                className="mt-1 size-4 accent-primary"
              />
              <div className="flex-1">
                <span className="text-sm leading-none font-medium">Abertura de Vaga</span>
                <p className="text-sm text-muted-foreground">
                  Solicite a abertura de vaga em uma disciplina com vagas esgotadas
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 rounded-lg border-2 border-border p-4 transition-colors hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
              <input
                type="radio"
                value="abertura_escopo"
                {...register("tipoSolicitacao")}
                className="mt-1 size-4 accent-primary"
              />
              <div className="flex-1">
                <span className="text-sm leading-none font-medium">Abertura de Escopo</span>
                <p className="text-sm text-muted-foreground">
                  Solicite a inclusão de uma disciplina fora do seu escopo curricular
                </p>
              </div>
            </label>
          </div>

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
          disabled={isSubmitting || !emailSessao}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : !emailSessao ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
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
