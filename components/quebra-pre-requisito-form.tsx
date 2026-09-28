"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send, CheckCircle, CheckCircle2, Upload, X, FileText, Info } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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

// Critérios da Resolução para a quebra de pré-requisito - exibidos como
// checklist informativo antes do envio (o aluno não marca item a item, só
// confirma ter lido, com a caixa "cienteRegras" abaixo da lista).
const CRITERIOS_QUEBRA_PRE_REQUISITO = [
  "Estar no Plano de Integralização Curricular (PIC)*",
  "Coeficiente de Rendimento maior ou igual a 8,0",
  "Não ter sido reprovado por falta",
  "Não ter sido reprovado por nota",
  "Ter realizado a Disciplina Optativa",
  "Ter a anuência do professor da disciplina que se deseja quebrar o pré-requisito",
]

// Sem campo de e-mail no formulário - o e-mail usado é sempre o da conta
// autenticada, obtido direto da sessão do Supabase no momento do envio (ver
// AjusteMatriculaForm para o mesmo padrão e o porquê).
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
  justificativa: z
    .string()
    .min(20, "Descreva a justificativa com pelo menos 20 caracteres"),
  cienteRegras: z.boolean().refine((valor) => valor === true, {
    message: "Você precisa confirmar que está ciente das regras antes de enviar",
  }),
})

type FormData = z.infer<typeof formSchema>

type FileKind = "formulario" | "historico"

export function QuebraPreRequisitoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formularioFile, setFormularioFile] = useState<File | null>(null)
  const [historicoFile, setHistoricoFile] = useState<File | null>(null)
  const [fileErrors, setFileErrors] = useState<{ formulario?: string; historico?: string }>({})
  const [emailSessao, setEmailSessao] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cienteRegras: false,
    },
  })

  // Ver AjusteMatriculaForm: mesmo padrão de restringir a digitação (só
  // números / maiúsculas) encadeando com o onChange do react-hook-form.
  const registroMatricula = register("matricula")
  const registroTelefone = register("telefone")
  const registroCodigoDisciplina = register("codigoDisciplina")

  const cienteRegras = watch("cienteRegras")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmailSessao(data.user?.email ?? null)
    })
  }, [])

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
    // Formulário e histórico parcial são ambos obrigatórios neste fluxo -
    // o histórico comprova o cumprimento dos critérios (CR, disciplina
    // optativa etc.) declarados no checklist acima.
    let temErroDeArquivo = false
    if (!formularioFile) {
      setFileErrors((prev) => ({ ...prev, formulario: "O formulário assinado é obrigatório" }))
      temErroDeArquivo = true
    }
    if (!historicoFile) {
      setFileErrors((prev) => ({ ...prev, historico: "O histórico parcial é obrigatório" }))
      temErroDeArquivo = true
    }
    if (temErroDeArquivo) return

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
      formData.append("justificativa", data.justificativa)
      formData.append("formulario", formularioFile as File)
      formData.append("historico", historicoFile as File)

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
          <CardTitle>Regras para Quebra de Pré-Requisito</CardTitle>
          <CardDescription>
            Leia os critérios abaixo antes de enviar a solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              A quebra de pré-requisito será aprovada somente quando o estudante cumprir com{" "}
              <span className="font-medium">TODOS</span> os critérios abaixo (exceto o item I).
              O estudante em PIC terá prioridade na quebra de pré-requisito e não será necessário
              cumprir com as outras exigências.
            </p>
          </div>

          <ul className="space-y-2">
            {CRITERIOS_QUEBRA_PRE_REQUISITO.map((criterio, indice) => (
              <li key={criterio} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  {indice === 0 ? (
                    <>
                      {criterio} <span className="text-muted-foreground">*</span>
                    </>
                  ) : (
                    criterio
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            * O estudante em PIC (item I) terá prioridade na quebra de pré-requisito e não
            precisará cumprir com as demais exigências (itens II a VI).
          </p>

          <div className="flex items-start space-x-3 rounded-lg border border-border p-4">
            <Checkbox
              id="cienteRegras"
              checked={cienteRegras}
              onCheckedChange={(checked) => setValue("cienteRegras", checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="cienteRegras" className="cursor-pointer text-sm font-normal">
              Declaro estar ciente dos critérios acima para a quebra de pré-requisito.{" "}
              <span className="text-destructive">*</span>
            </Label>
          </div>
          {errors.cienteRegras && (
            <p className="text-sm text-destructive">{errors.cienteRegras.message}</p>
          )}
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
            Anexe o formulário de solicitação assinado e o histórico parcial - ambos
            obrigatórios (PDF, JPG ou PNG - máx. 10MB)
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
              <FieldLabel>
                Histórico Parcial <span className="text-destructive">*</span>
              </FieldLabel>
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
        <Button type="submit" size="lg" disabled={isSubmitting || !emailSessao} className="w-full sm:w-auto">
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
