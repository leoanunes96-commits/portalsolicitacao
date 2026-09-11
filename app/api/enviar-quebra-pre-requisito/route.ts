import { NextResponse } from "next/server"
import { Resend } from "resend"

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
    const historicoFile = formData.get("historico") as File | null

    // Validate required fields
    if (
      !nomeCompleto ||
      !matricula ||
      !telefone ||
      !email ||
      !codigoDisciplina ||
      !nomeDisciplina ||
      !justificativa ||
      !formularioFile
    ) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      )
    }

    // Convert files to base64
    const formularioBuffer = await formularioFile.arrayBuffer()
    const formularioBase64 = Buffer.from(formularioBuffer).toString("base64")

    let historicoBase64: string | null = null
    if (historicoFile && historicoFile.size > 0) {
      const historicoBuffer = await historicoFile.arrayBuffer()
      historicoBase64 = Buffer.from(historicoBuffer).toString("base64")
    }

    // Get file extensions for proper naming
    const getFileExtension = (filename: string) => {
      const parts = filename.split(".")
      return parts.length > 1 ? parts[parts.length - 1] : "pdf"
    }

    const formularioExtension = getFileExtension(formularioFile.name)

    const attachments = [
      {
        filename: `formulario_quebra_pre_requisito_${nomeCompleto.replace(/\s+/g, "_")}.${formularioExtension}`,
        content: formularioBase64,
      },
    ]

    if (historicoBase64 && historicoFile) {
      const historicoExtension = getFileExtension(historicoFile.name)
      attachments.push({
        filename: `historico_parcial_${nomeCompleto.replace(/\s+/g, "_")}.${historicoExtension}`,
        content: historicoBase64,
      })
    }

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - returning success without sending email")
      return NextResponse.json({
        success: true,
        message: "Formulário processado. Configure a chave da API Resend para enviar e-mails.",
        emailSent: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "Solicitações do Colegiado <onboarding@resend.dev>",
      to: ["colegiado@colegiado.edu.br"],
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
        <p>O formulário de solicitação assinado${historicoBase64 ? " e o histórico parcial estão" : " está"} em anexo.</p>
        <p>Este e-mail foi enviado através do Portal de Solicitações do Colegiado de Curso.</p>
      `,
      attachments,
    })

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
