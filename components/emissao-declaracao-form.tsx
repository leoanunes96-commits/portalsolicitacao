"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CheckCircle2, AlertCircle, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z
    .string()
    .min(14, "CPF inválido")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
  matricula: z.string().min(1, "Número de matrícula é obrigatório"),
  semestreAtual: z.string().min(1, "Semestre letivo atual é obrigatório"),
  previsaoConclusao: z.string().min(1, "Previsão de conclusão é obrigatória"),
  cargaHorariaSemestral: z.string().min(1, "Carga horária semestral é obrigatória"),
  cargaHorariaTotal: z.string().min(1, "Carga horária total é obrigatória"),
  email: z.string().email("E-mail inválido"),
})

type FormData = z.infer<typeof formSchema>

// Generate year options for prediction
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear + i)
const semesters = ["1", "2"]

export function EmissaoDeclaracaoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      matricula: "",
      semestreAtual: "",
      previsaoConclusao: "",
      cargaHorariaSemestral: "",
      cargaHorariaTotal: "",
      email: "",
    },
  })

  const previsaoConclusao = watch("previsaoConclusao")
  const semestreAtual = watch("semestreAtual")

  // CPF mask
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue("cpf", formatted)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const response = await fetch("/api/emitir-declaracao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus("success")
        if (result.emailSent) {
          setStatusMessage(
            "Solicitação enviada com sucesso! A coordenação receberá sua declaração para assinatura. Você receberá uma cópia no seu e-mail."
          )
        } else {
          setStatusMessage(result.message)
        }
        reset()
      } else {
        setSubmitStatus("error")
        setStatusMessage(result.error || "Ocorreu um erro ao processar sua solicitação")
      }
    } catch {
      setSubmitStatus("error")
      setStatusMessage("Erro de conexão. Tente novamente mais tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Declaração de Regularidade Acadêmica</CardTitle>
            <CardDescription>
              Preencha seus dados para solicitar a declaração
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {submitStatus !== "idle" && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg p-4 ${
              submitStatus === "success"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {submitStatus === "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm">{statusMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dados Pessoais
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nome">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Digite seu nome completo"
                  {...register("nome")}
                  className="mt-1.5"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  {...register("cpf")}
                  onChange={handleCPFChange}
                  maxLength={14}
                  className="mt-1.5"
                />
                {errors.cpf && (
                  <p className="mt-1 text-sm text-destructive">{errors.cpf.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">
                  E-mail <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  {...register("email")}
                  className="mt-1.5"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dados Acadêmicos
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="matricula">
                  Número de Matrícula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="matricula"
                  placeholder="Ex: 2021123456"
                  {...register("matricula")}
                  className="mt-1.5"
                />
                {errors.matricula && (
                  <p className="mt-1 text-sm text-destructive">{errors.matricula.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="semestreAtual">
                  Semestre Letivo Atual <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={semestreAtual}
                  onValueChange={(value) => setValue("semestreAtual", value)}
                >
                  <SelectTrigger id="semestreAtual" className="mt-1.5">
                    <SelectValue placeholder="Selecione o semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.slice(0, 3).flatMap((year) =>
                      semesters.map((sem) => (
                        <SelectItem key={`${year}/${sem}`} value={`${year}/${sem}`}>
                          {year}/{sem}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.semestreAtual && (
                  <p className="mt-1 text-sm text-destructive">{errors.semestreAtual.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="previsaoConclusao">
                  Previsão de Conclusão <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={previsaoConclusao}
                  onValueChange={(value) => setValue("previsaoConclusao", value)}
                >
                  <SelectTrigger id="previsaoConclusao" className="mt-1.5">
                    <SelectValue placeholder="Selecione a previsão" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.flatMap((year) =>
                      semesters.map((sem) => (
                        <SelectItem key={`prev-${year}/${sem}`} value={`${year}/${sem}`}>
                          {year}/{sem}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.previsaoConclusao && (
                  <p className="mt-1 text-sm text-destructive">{errors.previsaoConclusao.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cargaHorariaSemestral">
                  Carga Horária Semestral Atual <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cargaHorariaSemestral"
                  type="number"
                  placeholder="Ex: 420"
                  {...register("cargaHorariaSemestral")}
                  className="mt-1.5"
                />
                {errors.cargaHorariaSemestral && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.cargaHorariaSemestral.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="cargaHorariaTotal">
                  Carga Horária Total Cursada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cargaHorariaTotal"
                  type="number"
                  placeholder="Ex: 2400"
                  {...register("cargaHorariaTotal")}
                  className="mt-1.5"
                />
                {errors.cargaHorariaTotal && (
                  <p className="mt-1 text-sm text-destructive">{errors.cargaHorariaTotal.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              A declaração será enviada para a coordenação do curso para assinatura. 
              Após assinada, você receberá o documento em seu e-mail.
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Solicitar Declaração"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
