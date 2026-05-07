import { NextResponse } from "next/server"
import { Resend } from "resend"
import { docentes } from "@/lib/docentes"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nome = formData.get("nome") as string
    const email = formData.get("email") as string
    const docentesSelecionadosJson = formData.get("docentesSelecionados") as string
    const atestadoFile = formData.get("atestado") as File
    const comprovanteFile = formData.get("comprovante") as File

    // Validate required fields
    if (!nome || !email || !docentesSelecionadosJson || !atestadoFile || !comprovanteFile) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      )
    }

    const docentesSelecionados: string[] = JSON.parse(docentesSelecionadosJson)

    if (docentesSelecionados.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um docente" },
        { status: 400 }
      )
    }

    // Get selected docentes data
    const docentesParaEnviar = docentes.filter((d) =>
      docentesSelecionados.includes(d.id)
    )

    if (docentesParaEnviar.length === 0) {
      return NextResponse.json(
        { error: "Docentes selecionados não encontrados" },
        { status: 400 }
      )
    }

    // Convert files to base64
    const atestadoBuffer = await atestadoFile.arrayBuffer()
    const atestadoBase64 = Buffer.from(atestadoBuffer).toString("base64")

    const comprovanteBuffer = await comprovanteFile.arrayBuffer()
    const comprovanteBase64 = Buffer.from(comprovanteBuffer).toString("base64")

    // Get file extensions for proper naming
    const getFileExtension = (filename: string) => {
      const parts = filename.split(".")
      return parts.length > 1 ? parts[parts.length - 1] : "pdf"
    }

    const atestadoExtension = getFileExtension(atestadoFile.name)
    const comprovanteExtension = getFileExtension(comprovanteFile.name)

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] RESEND_API_KEY not set - returning success without sending email")
      return NextResponse.json({
        success: true,
        message: "Formulário processado. Configure a chave da API Resend para enviar e-mails.",
        emailSent: false,
        docentesNotificados: docentesParaEnviar.map((d) => d.nome),
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Create email HTML content
    const htmlContent = `
      <h2>Envio de Atestado Médico</h2>
      <p><strong>Aluno(a):</strong> ${nome}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <hr/>
      <p>Segue em anexo o atestado médico e o comprovante de matrícula do(a) aluno(a).</p>
      <p>Este e-mail foi enviado através do Portal de Solicitações do Curso de Fonoaudiologia - UFES.</p>
    `

    // Send email to each selected docente
    const emailPromises = docentesParaEnviar.map((docente) =>
      resend.emails.send({
        from: "Solicitações Fonoaudiologia <onboarding@resend.dev>",
        to: [docente.email],
        cc: [email], // Student receives a copy
        replyTo: email,
        subject: `Atestado Médico | ${nome}`,
        html: `
          <p><strong>Para:</strong> ${docente.nome}</p>
          ${htmlContent}
        `,
        attachments: [
          {
            filename: `atestado_${nome.replace(/\s+/g, "_")}.${atestadoExtension}`,
            content: atestadoBase64,
          },
          {
            filename: `comprovante_matricula_${nome.replace(/\s+/g, "_")}.${comprovanteExtension}`,
            content: comprovanteBase64,
          },
        ],
      })
    )

    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: "Atestado enviado com sucesso!",
      emailSent: true,
      docentesNotificados: docentesParaEnviar.map((d) => d.nome),
    })
  } catch (error) {
    console.error("[v0] Error processing request:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
