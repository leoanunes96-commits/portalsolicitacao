import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { Resend } from "resend"
import fs from "fs/promises"
import path from "path"

interface SolicitacaoData {
  nomeCompleto: string
  matricula: string
  telefone: string
  email: string
  codigoDisciplina: string
  nomeDisciplina: string
  turma?: string
  tipoSolicitacao: "abertura_vaga" | "abertura_escopo"
}

export async function POST(request: Request) {
  try {
    const data: SolicitacaoData = await request.json()

    // Validate required fields
    if (!data.nomeCompleto || !data.matricula || !data.telefone || 
        !data.email || !data.codigoDisciplina || !data.nomeDisciplina || 
        !data.tipoSolicitacao) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      )
    }

    // Load the PDF template
    const templatePath = path.join(process.cwd(), "public", "formulario_template.pdf")
    const templateBytes = await fs.readFile(templatePath)
    
    // Create a new PDF document from the template
    const pdfDoc = await PDFDocument.load(templateBytes)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    
    // Get page dimensions
    const { height } = firstPage.getSize()
    
    // Map tipo de solicitação to display text
    const tipoSolicitacaoTexto = data.tipoSolicitacao === "abertura_vaga" 
      ? "Aumento de Vaga" 
      : "Abertura de Escopo"

    // Fill in the form fields
    // Checkbox marking based on tipo de solicitação
    // The PDF has checkboxes at specific positions
    
    // Mark the appropriate checkbox (X mark)
    if (data.tipoSolicitacao === "abertura_escopo") {
      // Abertura de Escopo checkbox
      firstPage.drawText("X", {
        x: 188,
        y: height - 152,
        size: 12,
        font: helveticaBold,
      })
    } else {
      // Aumento de Vaga checkbox
      firstPage.drawText("X", {
        x: 289,
        y: height - 152,
        size: 12,
        font: helveticaBold,
      })
    }

    // Fill in student information
    // Aluno (Name)
    firstPage.drawText(data.nomeCompleto, {
      x: 80,
      y: height - 187,
      size: 10,
      font: helveticaFont,
    })

    // Matrícula
    firstPage.drawText(data.matricula, {
      x: 80,
      y: height - 206,
      size: 10,
      font: helveticaFont,
    })

    // Telefone
    firstPage.drawText(data.telefone, {
      x: 65,
      y: height - 225,
      size: 10,
      font: helveticaFont,
    })

    // E-mail
    firstPage.drawText(data.email, {
      x: 75,
      y: height - 244,
      size: 10,
      font: helveticaFont,
    })

    // Discipline table - first row
    // Código
    firstPage.drawText(data.codigoDisciplina, {
      x: 68,
      y: height - 288,
      size: 9,
      font: helveticaFont,
    })

    // Nome da disciplina
    firstPage.drawText(data.nomeDisciplina, {
      x: 162,
      y: height - 288,
      size: 9,
      font: helveticaFont,
    })

    // Turma
    if (data.turma) {
      firstPage.drawText(data.turma, {
        x: 372,
        y: height - 288,
        size: 9,
        font: helveticaFont,
      })
    }

    // Justificativa
    const justificativa = `Solicitação de ${tipoSolicitacaoTexto.toLowerCase()} para a disciplina ${data.nomeDisciplina} (${data.codigoDisciplina}).`
    firstPage.drawText(justificativa, {
      x: 68,
      y: height - 410,
      size: 9,
      font: helveticaFont,
      maxWidth: 480,
    })

    // Current date
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const year = String(today.getFullYear())

    firstPage.drawText(day, {
      x: 435,
      y: height - 470,
      size: 10,
      font: helveticaFont,
    })

    firstPage.drawText(month, {
      x: 458,
      y: height - 470,
      size: 10,
      font: helveticaFont,
    })

    firstPage.drawText(year, {
      x: 480,
      y: height - 470,
      size: 10,
      font: helveticaFont,
    })

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64")

    // Send email with the filled PDF
    const assunto = `${tipoSolicitacaoTexto} | ${data.nomeCompleto}`

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] RESEND_API_KEY not set - returning PDF without sending email")
      // Return success but indicate email wasn't sent
      return NextResponse.json({
        success: true,
        message: "Formulário gerado com sucesso. Configure a chave da API Resend para enviar por e-mail.",
        emailSent: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: "Solicitações Fonoaudiologia <onboarding@resend.dev>",
      to: ["fonoaudiologia@ufes.br"],
      cc: [data.email], // Student receives a copy
      replyTo: data.email,
      subject: assunto,
      html: `
        <h2>Nova Solicitação de Ajuste de Matrícula</h2>
        <p><strong>Tipo:</strong> ${tipoSolicitacaoTexto}</p>
        <p><strong>Aluno:</strong> ${data.nomeCompleto}</p>
        <p><strong>Matrícula:</strong> ${data.matricula}</p>
        <p><strong>Telefone:</strong> ${data.telefone}</p>
        <p><strong>E-mail:</strong> ${data.email}</p>
        <hr/>
        <p><strong>Disciplina:</strong> ${data.nomeDisciplina}</p>
        <p><strong>Código:</strong> ${data.codigoDisciplina}</p>
        ${data.turma ? `<p><strong>Turma:</strong> ${data.turma}</p>` : ""}
        <hr/>
        <p>O formulário preenchido está em anexo.</p>
      `,
      attachments: [
        {
          filename: `solicitacao_${data.matricula}_${Date.now()}.pdf`,
          content: pdfBase64,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso!",
      emailSent: true,
    })
  } catch (error) {
    console.error("[v0] Error processing request:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
