import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { Resend } from "resend"
import fs from "fs/promises"
import path from "path"

interface DeclaracaoData {
  nome: string
  cpf: string
  matricula: string
  semestreAtual: string
  previsaoConclusao: string
  cargaHorariaSemestral: string
  cargaHorariaTotal: string
  email: string
}

export async function POST(request: Request) {
  try {
    const data: DeclaracaoData = await request.json()

    // Validate required fields
    const requiredFields = [
      "nome",
      "cpf",
      "matricula",
      "semestreAtual",
      "previsaoConclusao",
      "cargaHorariaSemestral",
      "cargaHorariaTotal",
      "email",
    ]
    
    for (const field of requiredFields) {
      if (!data[field as keyof DeclaracaoData]) {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        )
      }
    }

    // Load the PDF template
    const templatePath = path.join(process.cwd(), "public", "declaracao_template.pdf")
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)

    // Get the first page
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Clear the page and recreate with filled data
    // Draw a white rectangle to cover the template text area
    firstPage.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
    })

    // Recreate the document with filled data
    const fontSize = 11
    const lineHeight = 18
    const margin = 60
    let y = height - 60

    // Header - UFES
    firstPage.drawText("UNIVERSIDADE FEDERAL DO ESPÍRITO SANTO", {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight

    firstPage.drawText("Centro de Ciências da Saúde", {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight

    firstPage.drawText("Colegiado de Fonoaudiologia", {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight * 3

    // Title
    firstPage.drawText("DECLARAÇÃO", {
      x: width / 2 - 50,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight * 2

    // Content paragraph 1
    const paragraph1 = `Declaramos, para os devidos fins de direito, que ${data.nome}, CPF ${data.cpf} é aluno(a) desta Universidade Federal do Espírito Santo, registrado(a) sob o nº de matrícula: ${data.matricula}, no curso de graduação: 281 – FONOAUDIOLOGIA – BACHARELADO – PRESENCIAL – INTEGRAL. O curso tem duração mínima de 09 (nove) semestres e máximo de 12 (doze) semestres. Carga horária mínima para Graduação: 4000h. Carga horária máxima por semestre: 630h. Carga horária de estágio obrigatório: 800h. O(A) aluno(a) está regularmente matriculado(a) no semestre letivo de ${data.semestreAtual}.`

    // Wrap text function
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      const words = text.split(" ")
      const lines: string[] = []
      let currentLine = ""

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const textWidth = font.widthOfTextAtSize(testLine, fontSize)

        if (textWidth > maxWidth) {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            lines.push(word)
          }
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        lines.push(currentLine)
      }

      return lines
    }

    const maxWidth = width - margin * 2
    const lines1 = wrapText(paragraph1, maxWidth, fontSize)

    for (const line of lines1) {
      firstPage.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      y -= lineHeight
    }

    y -= lineHeight

    // Content paragraph 2
    const paragraph2 = `Declara-se ainda que o(a) discente possui previsão para conclusão em ${data.previsaoConclusao}. O(a) discente está cursando atualmente ${data.cargaHorariaSemestral} horas semestrais e cursou carga horária total de ${data.cargaHorariaTotal}h.`

    const lines2 = wrapText(paragraph2, maxWidth, fontSize)

    for (const line of lines2) {
      firstPage.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      y -= lineHeight
    }

    y -= lineHeight * 3

    // Signature line
    firstPage.drawText("___________________________________", {
      x: width / 2 - 100,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight

    firstPage.drawText("MARGARETH ATTIANEZI BRACET", {
      x: width / 2 - 85,
      y,
      size: fontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight

    firstPage.drawText("Coordenação do Curso de Fonoaudiologia", {
      x: width / 2 - 100,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })

    // Footer
    const footerY = 60
    firstPage.drawText("Av. Marechal Campos 1468, Maruípe - CEP 29040-090 - Vitória - ES", {
      x: margin,
      y: footerY,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    firstPage.drawText("departamento.fonoaudiologia@ufes.br | (27) 99298-6884", {
      x: margin,
      y: footerY - 12,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Save the PDF
    const pdfBytes = await pdfDoc.save()

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] RESEND_API_KEY not set - returning PDF without sending email")
      return NextResponse.json({
        success: true,
        message: "Declaração gerada com sucesso. Configure a chave da API Resend para enviar por e-mail.",
        emailSent: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Send email
    const assunto = `Solicitação de Declaração | ${data.nome}`

    await resend.emails.send({
      from: "Solicitações Fonoaudiologia <onboarding@resend.dev>",
      to: ["fonoaudiologia@ufes.br"],
      cc: [data.email], // Student receives a copy
      replyTo: data.email,
      subject: assunto,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Solicitação de Declaração de Regularidade Acadêmica</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Dados do Discente</h3>
            <p><strong>Nome:</strong> ${data.nome}</p>
            <p><strong>CPF:</strong> ${data.cpf}</p>
            <p><strong>Matrícula:</strong> ${data.matricula}</p>
            <p><strong>E-mail:</strong> ${data.email}</p>
          </div>

          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Dados Acadêmicos</h3>
            <p><strong>Semestre Letivo Atual:</strong> ${data.semestreAtual}</p>
            <p><strong>Previsão de Conclusão:</strong> ${data.previsaoConclusao}</p>
            <p><strong>Carga Horária Semestral:</strong> ${data.cargaHorariaSemestral}h</p>
            <p><strong>Carga Horária Total Cursada:</strong> ${data.cargaHorariaTotal}h</p>
          </div>

          <p style="color: #666;">
            Segue em anexo a declaração para assinatura da coordenação.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            Esta mensagem foi enviada automaticamente pelo sistema de solicitações do curso de Fonoaudiologia - UFES.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Declaracao_${data.nome.replace(/\s+/g, "_")}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso!",
      emailSent: true,
    })
  } catch (error) {
    console.error("[v0] Error processing declaration request:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Tente novamente." },
      { status: 500 }
    )
  }
}
