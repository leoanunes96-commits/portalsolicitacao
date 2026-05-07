"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Send, CheckCircle, Upload, X, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { docentes, type Docente } from "@/lib/docentes"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  docentesSelecionados: z.array(z.string()).min(1, "Selecione pelo menos um docente"),
})

type FormData = z.infer<typeof formSchema>

export function EnvioAtestadoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [atestadoFile, setAtestadoFile] = useState<File | null>(null)
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)
  const [fileErrors, setFileErrors] = useState<{ atestado?: string; comprovante?: string }>({})

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docentesSelecionados: [],
    },
  })

  const docentesSelecionados = watch("docentesSelecionados")

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "atestado" | "comprovante"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({
        ...prev,
        [type]: "O arquivo deve ter no máximo 10MB",
      }))
      return
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [type]: "Formato inválido. Aceitos: PDF, JPG, PNG",
      }))
      return
    }

    setFileErrors((prev) => ({ ...prev, [type]: undefined }))
    
    if (type === "atestado") {
      setAtestadoFile(file)
    } else {
      setComprovanteFile(file)
    }
  }

  const removeFile = (type: "atestado" | "comprovante") => {
    if (type === "atestado") {
      setAtestadoFile(null)
    } else {
      setComprovanteFile(null)
    }
  }

  const handleDocenteToggle = (docenteId: string, checked: boolean) => {
    const current = docentesSelecionados || []
    if (checked) {
      setValue("docentesSelecionados", [...current, docenteId])
    } else {
      setValue(
        "docentesSelecionados",
        current.filter((id) => id !== docenteId)
      )
    }
  }

  const onSubmit = async (data: FormData) => {
    // Validate files
    if (!atestadoFile) {
      setFileErrors((prev) => ({ ...prev, atestado: "O atestado é obrigatório" }))
      return
    }
    if (!comprovanteFile) {
      setFileErrors((prev) => ({ ...prev, comprovante: "O comprovante de matrícula é obrigatório" }))
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("nome", data.nome)
      formData.append("email", data.email)
      formData.append("docentesSelecionados", JSON.stringify(data.docentesSelecionados))
      formData.append("atestado", atestadoFile)
      formData.append("comprovante", comprovanteFile)

      const response = await fetch("/api/enviar-atestado", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar atestado")
      }

      setIsSuccess(true)
      toast.success("Atestado enviado com sucesso!")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao enviar atestado")
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
              Atestado Enviado!
            </h3>
            <p className="mb-6 max-w-md text-green-700">
              Seu atestado foi enviado com sucesso para os docentes selecionados.
              Você também receberá uma cópia no seu e-mail.
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
              <FieldLabel htmlFor="nome">
                Nome Completo <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="nome"
                placeholder="Digite seu nome completo"
                {...register("nome")}
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && (
                <FieldDescription className="text-destructive">
                  {errors.nome.message}
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
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            Anexe o atestado médico e o comprovante de matrícula (PDF, JPG ou PNG - máx. 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                Atestado Médico <span className="text-destructive">*</span>
              </FieldLabel>
              {atestadoFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{atestadoFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(atestadoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile("atestado")}
                  >
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
                    onChange={(e) => handleFileChange(e, "atestado")}
                  />
                </label>
              )}
              {fileErrors.atestado && (
                <FieldDescription className="text-destructive">
                  {fileErrors.atestado}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel>
                Comprovante de Matrícula <span className="text-destructive">*</span>
              </FieldLabel>
              {comprovanteFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{comprovanteFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(comprovanteFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile("comprovante")}
                  >
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
                    onChange={(e) => handleFileChange(e, "comprovante")}
                  />
                </label>
              )}
              {fileErrors.comprovante && (
                <FieldDescription className="text-destructive">
                  {fileErrors.comprovante}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Docentes Responsáveis</CardTitle>
          <CardDescription>
            Selecione os docentes responsáveis pelas disciplinas em que houve falta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {docentes.map((docente: Docente) => (
              <div
                key={docente.id}
                className="flex items-start space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <Checkbox
                  id={`docente-${docente.id}`}
                  checked={docentesSelecionados?.includes(docente.id)}
                  onCheckedChange={(checked) =>
                    handleDocenteToggle(docente.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`docente-${docente.id}`}
                    className="cursor-pointer font-medium"
                  >
                    {docente.nome}
                  </Label>
                  <p className="text-sm text-muted-foreground">{docente.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {docente.disciplinas.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {errors.docentesSelecionados && (
            <p className="mt-3 text-sm text-destructive">
              {errors.docentesSelecionados.message}
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
              Enviar Atestado
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
        Você receberá uma cópia dos e-mails enviados.
      </p>
    </form>
  )
}
