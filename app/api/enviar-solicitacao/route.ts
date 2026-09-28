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
    const turma = (formData.get("turma") as string) || ""
    const tipoSolicitacao = formData.get("tipoSolicitacao") as "abertura_vaga" | "abertura_escopo"
    const formularioFile = formData.get("formulario") as File

    // Validate required fields
    if (
      !nomeCompleto ||
      !matricula ||
      !telefone ||
      !email ||
      !codigoDisciplina ||
      !nomeDisciplina ||
      !tipoSolicitacao ||
      !formularioFile
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

    const tipoSolicitacaoTexto =
      tipoSolicitacao === "abertura_vaga" ? "Aumento de Vaga" : "Abertura de Escopo"

    // Registra a solicitação no banco (painel de status / auditoria) antes de enviar
    // o e-mail. Best-effort: se o banco não estiver configurado, segue sem persistir.
    const solicitacaoRegistrada = await registrarSolicitacao({
      tipoFluxo: "AJUSTE_MATRICULA",
      nomeCompleto,
      matricula,
      telefone,
      email,
      dadosEspecificos: {
        codigoDisciplina,
        nomeDisciplina,
        turma: turma || null,
        tipoSolicitacao,
      },
    })

    // Converte o formulário enviado (preenchido e assinado pelo aluno) para
    // anexar por e-mail - não geramos mais um PDF do zero aqui, porque um PDF
    // gerado pelo sistema não teria a assinatura (RF exige a assinatura,
    // digital ou física, no documento).
    const formularioBuffer = await formularioFile.arrayBuffer()
    const formularioBase64 = Buffer.from(formularioBuffer).toString("base64")
    const getFileExtension = (filename: string) => {
      const parts = filename.split(".")
      return parts.length > 1 ? parts[parts.length - 1] : "pdf"
    }
    const formularioExtension = getFileExtension(formularioFile.name)

    const assunto = `${tipoSolicitacaoTexto} | ${nomeCompleto}`

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
      // Endereço de quem vai atender as solicitações (o "administrador" do
      // sistema) - configurável via ADMIN_NOTIFICATION_EMAIL para não
      // depender de um endereço de exemplo que não existe de verdade.
      to: [process.env.ADMIN_NOTIFICATION_EMAIL || "colegiado@colegiado.edu.br"],
      cc: [email], // Student receives a copy
      replyTo: email,
      subject: assunto,
      html: `
        <h2>Nova Solicitação de Ajuste de Matrícula</h2>
        <p><strong>Tipo:</strong> ${tipoSolicitacaoTexto}</p>
        <p><strong>Aluno:</strong> ${nomeCompleto}</p>
        <p><strong>Matrícula:</strong> ${matricula}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <hr/>
        <p><strong>Disciplina:</strong> ${nomeDisciplina}</p>
        <p><strong>Código:</strong> ${codigoDisciplina}</p>
        ${turma ? `<p><strong>Turma:</strong> ${turma}</p>` : ""}
        <hr/>
        <p>O formulário preenchido e assinado pelo aluno está em anexo.</p>
      `,
      attachments: [
        {
          filename: `solicitacao_ajuste_matricula_${matricula}.${formularioExtension}`,
          content: formularioBase64,
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
