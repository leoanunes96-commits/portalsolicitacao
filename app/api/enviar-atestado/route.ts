import { NextResponse } from "next/server"
import { Resend } from "resend"
import { docentes } from "@/lib/docentes"
import { registrarSolicitacao, marcarEmailEnviado } from "@/lib/solicitacoes"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nome = formData.get("nome") as string
    const email = formData.get("email") as string
    const docentesSelecionadosJson = formData.get("docentesSelecionados") as string
    const atestadoFile = formData.get("atestado") as File
    const comprovanteFile = formData.get("comprovante") as File
    const solicitarSegundaChamada = formData.get("solicitarSegundaChamada") === "true"
    const descricaoAtividadePerdida = (formData.get("descricaoAtividadePerdida") as string) || ""

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
      console.log("RESEND_API_KEY not set - returning success without sending email")
      return NextResponse.json({
        success: true,
        message: "Formulário processado. Configure a chave da API Resend para enviar e-mails.",
        emailSent: false,
        docentesNotificados: docentesParaEnviar.map((d) => d.nome),
      })
    }

    // Registra a solicitação no banco (painel de status / auditoria) antes de enviar
    // o e-mail. Best-effort: se o banco não estiver configurado, segue sem persistir.
    // Observação: este fluxo hoje não coleta matrícula/telefone no formulário, por
    // isso ficam nulos aqui.
    const solicitacaoRegistrada = await registrarSolicitacao({
      tipoFluxo: "ATESTADO_MEDICO",
      nomeCompleto: nome,
      matricula: null,
      telefone: null,
      email,
      dadosEspecificos: {
        docentesSelecionados,
        solicitarSegundaChamada,
        descricaoAtividadePerdida: descricaoAtividadePerdida || null,
      },
    })

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Create email HTML content
    const segundaChamadaHtml = solicitarSegundaChamada
      ? `
      <hr/>
      <p><strong>Pedido de segunda chamada de avaliação:</strong> Sim</p>
      <p><strong>Atividade perdida:</strong> ${descricaoAtividadePerdida || "não informado"}</p>
      `
      : ""

    const htmlContent = `
      <h2>Envio de Atestado Médico${solicitarSegundaChamada ? " / Pedido de Segunda Chamada" : ""}</h2>
      <p><strong>Aluno(a):</strong> ${nome}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <hr/>
      <p>Segue em anexo o atestado médico e o comprovante de matrícula do(a) aluno(a).</p>
      ${segundaChamadaHtml}
      <p>Este e-mail foi enviado através do Portal de Solicitações do Colegiado de Curso.</p>
    `

    // Send email to each selected docente
    const emailPromises = docentesParaEnviar.map((docente) =>
      resend.emails.send({
        from: "Solicitações do Colegiado <onboarding@resend.dev>",
        to: [docente.email],
        cc: [email], // Student receives a copy
        replyTo: email,
        subject: `${solicitarSegundaChamada ? "Atestado Médico / Segunda Chamada" : "Atestado Médico"} | ${nome}`,
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

    await marcarEmailEnviado(solicitacaoRegistrada?.id)

    return NextResponse.json({
      success: true,
      message: "Atestado enviado com sucesso!",
      emailSent: true,
      docentesNotificados: docentesParaEnviar.map((d) => d.nome),
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Por favor, tente novamente." },
      { status: 500 }
    )
  }
}
