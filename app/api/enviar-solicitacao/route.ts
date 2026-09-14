import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, PageSizes } from "pdf-lib"
import { Resend } from "resend"
import { registrarSolicitacao, marcarEmailEnviado } from "@/lib/solicitacoes"

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

    // Gera o PDF do zero (em vez de preencher um template fixo). Evita depender
    // de um arquivo de layout fixo e garante que o conteúdo é sempre genérico
    // (nenhum nome de instituição é inserido aqui, só o que vem do formulário).
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const firstPage = pdfDoc.addPage(PageSizes.A4)
    const { width, height } = firstPage.getSize()
    const margin = 56
    let cursorY = height - margin

    const tipoSolicitacaoTexto = data.tipoSolicitacao === "abertura_vaga"
      ? "Aumento de Vaga"
      : "Abertura de Escopo"

    const writeLine = (text: string, opts: { size?: number; font?: typeof helveticaFont; gap?: number } = {}) => {
      const size = opts.size ?? 11
      const font = opts.font ?? helveticaFont
      firstPage.drawText(text, { x: margin, y: cursorY, size, font, maxWidth: width - margin * 2 })
      cursorY -= opts.gap ?? size + 10
    }

    writeLine("FORMULÁRIO DE SOLICITAÇÃO — AJUSTE DE MATRÍCULA", { size: 14, font: helveticaBold, gap: 22 })
    writeLine("Colegiado de Curso de Graduação", { size: 10 })
    cursorY -= 10

    writeLine("Tipo de solicitação:", { size: 11, font: helveticaBold })
    writeLine(`${data.tipoSolicitacao === "abertura_vaga" ? "[X]" : "[ ]"} Aumento de Vaga`)
    writeLine(`${data.tipoSolicitacao === "abertura_escopo" ? "[X]" : "[ ]"} Abertura de Escopo`)
    cursorY -= 10

    writeLine("Dados do requerente:", { size: 11, font: helveticaBold })
    writeLine(`Nome completo: ${data.nomeCompleto}`)
    writeLine(`Matrícula: ${data.matricula}`)
    writeLine(`Telefone: ${data.telefone}`)
    writeLine(`E-mail: ${data.email}`)
    cursorY -= 10

    writeLine("Dados da disciplina:", { size: 11, font: helveticaBold })
    writeLine(`Código: ${data.codigoDisciplina}`)
    writeLine(`Nome da disciplina: ${data.nomeDisciplina}`)
    if (data.turma) {
      writeLine(`Turma: ${data.turma}`)
    }
    cursorY -= 10

    const justificativa = `Solicitação de ${tipoSolicitacaoTexto.toLowerCase()} para a disciplina ${data.nomeDisciplina} (${data.codigoDisciplina}).`
    writeLine("Justificativa:", { size: 11, font: helveticaBold })
    writeLine(justificativa, { gap: 30 })

    const today = new Date()
    const dataFormatada = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`
    writeLine(`Data da solicitação: ${dataFormatada}`)

    // Registra a solicitação no banco (painel de status / auditoria) antes de enviar
    // o e-mail. Best-effort: se o banco não estiver configurado, segue sem persistir.
    const solicitacaoRegistrada = await registrarSolicitacao({
      tipoFluxo: "AJUSTE_MATRICULA",
      nomeCompleto: data.nomeCompleto,
      matricula: data.matricula,
      telefone: data.telefone,
      email: data.email,
      dadosEspecificos: {
        codigoDisciplina: data.codigoDisciplina,
        nomeDisciplina: data.nomeDisciplina,
        turma: data.turma ?? null,
        tipoSolicitacao: data.tipoSolicitacao,
      },
    })

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64")

    // Send email with the filled PDF
    const assunto = `${tipoSolicitacaoTexto} | ${data.nomeCompleto}`

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - returning PDF without sending email")
      // Return success but indicate email wasn't sent
      return NextResponse.json({
        success: true,
        message: "Formulário gerado com sucesso. Configure a chave da API Resend para enviar por e-mail.",
        emailSent: false,
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: "Solicitações do Colegiado <onboarding@resend.dev>",
      to: ["colegiado@colegiado.edu.br"],
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
