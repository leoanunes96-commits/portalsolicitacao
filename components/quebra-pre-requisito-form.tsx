"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send, CheckCircle, Upload, X, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  matricula: z.string().min(1, "Número de matrícula é obrigatório"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("E-mail inválido"),
  codigoDisciplina: z.string().min(1, "Código da disciplina é obrigatório"),
  nomeDisciplina: z.string().min(1, "Nome da disciplina é obrigatório"),
  justificativa: z
    .string()
    .min(20, "Descreva a justificativa com pelo menos 20 caracteres"),
})

type FormData = z.infer<typeof formSchema>

type FileKind = "formulario" | "historico"

export function QuebraPreRequisitoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formularioFile, setFormularioFile] = useState<File | null>(null)
  const [historicoFile, setHistoricoFile] = useState<File | null>(null)
  const [fileErrors, setFileErrors] = useState<{ formulario?: string; historico?: string }>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: FileKind) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({ ...prev, [type]: "O arquivo deve ter no máximo 10MB" }))
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileErrors((prev) => ({ ...prev, [type]: "Formato inválido. Aceitos: PDF, JPG, PNG" }))
      return
    }

    setFileErrors((prev) => ({ ...prev, [type]: undefined }))

    if (type === "formulario") {
      setFormularioFile(file)
    } else {
      setHistoricoFile(file)
    }
  }

  const removeFile = (type: FileKind) => {
    if (type === "formulario") {
      setFormularioFile(null)
    } else {
      setHistoricoFile(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!formularioFile) {
      setFileErrors((prev) => ({ ...prev, formulario: "O formulário assinado é obrigatório" }))
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("nomeCompleto", data.nomeCompleto)
      formData.append("matricula", data.matricula)
      formData.append("telefone", data.telefone)
      formData.append("email", data.email)
      formData.append("codigoDisciplina", data.codigoDisciplina)
      formData.append("nomeDisciplina", data.nomeDisciplina)
      formData.append("justificativa", data.justificativa)
      formData.append("formulario", formularioFile)
      if (historicoFile) {
        formData.append("historico", historicoFile)
      }

      const response = await fetch("/api/enviar-quebra-pre-requisito", {
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
            <h3 className="mb-2 text-xl font-semibold text-green-900">Solicitação Enviada!</h3>
            <p className="mb-6 max-w-md text-green-700">
              Sua solicitação de quebra de pré-requisito foi enviada para a coordenação.
              Você receberá uma resposta por e-mail em breve.
            </p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
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
          <CardTitle>Disciplina e Justificativa</CardTitle>
          <CardDescription>
            Informe a disciplina cujo pré-requisito deseja quebrar e justifique o pedido
          </CardDescription>
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
                  placeholder="Ex: ABC12345"
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
                <FieldLabel htmlFor="nomeDisciplina">
                  Nome da Disciplina <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="nomeDisciplina"
                  placeholder="Ex: Estrutura de Dados"
                  {...register("nomeDisciplina")}
                  className={errors.nomeDisciplina ? "border-destructive" : ""}
                />
                {errors.nomeDisciplina && (
                  <FieldDescription className="text-destructive">
                    {errors.nomeDisciplina.message}
                  </FieldDescription>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="justificativa">
                Justificativa <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="justificativa"
                placeholder="Explique por que a quebra de pré-requisito é necessária, indicando o(s) ato(s) de responsabilidade da instituição que motivam o pedido, se aplicável."
                rows={5}
                {...register("justificativa")}
                className={errors.justificativa ? "border-destructive" : ""}
              />
              {errors.justificativa && (
                <FieldDescription className="text-destructive">
                  {errors.justificativa.message}
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
            Anexe o formulário de solicitação assinado (obrigatório) e, se tiver, o histórico parcial (PDF, JPG ou PNG - máx. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                Formulário de Solicitação Assinado <span className="text-destructive">*</span>
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile("formulario")}>
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
                    onChange={(e) => handleFileChange(e, "formulario")}
                  />
                </label>
              )}
              {fileErrors.formulario && (
                <FieldDescription className="text-destructive">{fileErrors.formulario}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel>Histórico Parcial (opcional)</FieldLabel>
              {historicoFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{historicoFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(historicoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile("historico")}>
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
                    onChange={(e) => handleFileChange(e, "historico")}
                  />
                </label>
              )}
              {fileErrors.historico && (
                <FieldDescription className="text-destructive">{fileErrors.historico}</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
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
