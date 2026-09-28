import { NextResponse } from "next/server"
import { Resend } from "resend"
import { registrarSolicitacao, marcarEmailEnviado } from "@/lib/solicitacoes"
import { REGEX_MATRICULA, REGEX_TELEFONE, REGEX_CODIGO_DISCIPLINA } from "@/lib/form-utils"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nomeCompleto = formData.get("nomeCompleto") as string
    const matricula = formData.get("matricula") as string
    const telefone = formData.get("telefone") as string
    const email = formData.get("email") as string
    const codigoDisciplina = formData.get("codigoDisciplina") as string
    const nomeDisciplina = formData.get("nomeDisciplina") as string
    const justificativa = formData.get("justificativa") as string
    const formularioFile = formData.get("formulario") as File
    const historicoFile = formData.get("historico") as File

    // Validate required fields
    if (
      !nomeCompleto ||
      !matricula ||
      !telefone ||
      !email ||
      !codigoDisciplina ||
      !nomeDisciplina ||
      !justificativa ||
      !formularioFile ||
      !historicoFile
    ) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      )
    }

    // Revalida no servidor os campos com formato restrito no formulário -
    // o front-end já impede a digitação fora do padrão, mas a API nunca deve
    // confiar apenas na validação do cliente.
    if (!REGEX_MATRICULA.test(matricula)) {
      return NextResponse.json({ error: "Matrícula inválida." }, { status: 400 })
    }
    if (!REGEX_TELEFONE.test(telefone)) {
      return NextResponse.json({ error: "Telefone inválido." }, { status: 400 })
    }
    if (!REGEX_CODIGO_DISCIPLINA.test(codigoDisciplina)) {
      return NextResponse.json({ error: "Código da disciplina inválido." }, { status: 400 })
    }

    // Convert files to base64
    const formularioBuffer = await formularioFile.arrayBuffer()
    const formularioBase64 = Buffer.from(formularioBuffer).toString("base64")

    const historicoBuffer = await historicoFile.arrayBuffer()
    const historicoBase64 = Buffer.from(historicoBuffer).toString("base64")

    // Get file extensions for proper naming
    const getFileExtension = (filename: string) => {
      const parts = filename.split(".")
      return parts.length > 1 ? parts[parts.length - 1] : "pdf"
    }

    const formularioExtension = getFileExtension(formularioFile.name)

    const historicoExtension = getFileExtension(historicoFile.name)

    const attachments = [
      {
        filename: `formulario_quebra_pre_requisito_${nomeCompleto.replace(/\s+/g, "_")}.${formularioExtension}`,
        content: formularioBase64,
      },
      {
        filename: `historico_parcial_${nomeCompleto.replace(/\s+/g, "_")}.${historicoExtension}`,
        content: historicoBase64,
      },
    ]

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - returning success without sending email")
      return NextResponse.json({
        success: true,
        message: "Formulário processado. Configure a chave da API Resend para enviar e-mails.",
        emailSent: false,
      })
    }

    // Registra a solicitação no banco (painel de status / auditoria) antes de enviar
    // o e-mail. Best-effort: se o banco não estiver configurado, segue sem persistir.
    const solicitacaoRegistrada = await registrarSolicitacao({
      tipoFluxo: "QUEBRA_PRE_REQUISITO",
      nomeCompleto,
      matricula,
      telefone,
      email,
      dadosEspecificos: {
        codigoDisciplina,
        nomeDisciplina,
        justificativa,
      },
    })

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "Solicitações do Colegiado <onboarding@resend.dev>",
      // Endereço de quem vai atender as solicitações (o "administrador" do
      // sistema) - configurável via ADMIN_NOTIFICATION_EMAIL (ver .env.example).
      to: [process.env.ADMIN_NOTIFICATION_EMAIL || "colegiado@colegiado.edu.br"],
      cc: [email], // Student receives a copy
      replyTo: email,
      subject: `Quebra de Pré-Requisito | ${nomeCompleto}`,
      html: `
        <h2>Nova Solicitação de Quebra de Pré-Requisito</h2>
        <p><strong>Aluno(a):</strong> ${nomeCompleto}</p>
        <p><strong>Matrícula:</strong> ${matricula}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <hr/>
        <p><strong>Disciplina:</strong> ${nomeDisciplina}</p>
        <p><strong>Código:</strong> ${codigoDisciplina}</p>
        <hr/>
        <p><strong>Justificativa:</strong></p>
        <p>${justificativa}</p>
        <hr/>
        <p>O formulário de solicitação assinado e o histórico parcial estão em anexo.</p>
        <p>Este e-mail foi enviado através do Portal de Solicitações do Colegiado de Curso.</p>
      `,
      attachments,
    })

    await marcarEmailEnviado(solicitacaoRegistrada?.id)

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso!",
      emailSent: true,
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
