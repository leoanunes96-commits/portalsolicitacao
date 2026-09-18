// Restringe a criação de contas a e-mails de domínios institucionais
// específicos. Os domínios em si NÃO ficam no código (ver regra de
// genericidade institucional em CLAUDE.md) - vêm de uma variável de
// ambiente, configurada só no .env/.env.local de cada instância (fora do
// repositório).
const dominiosPermitidos = (process.env.ALLOWED_STUDENT_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((dominio) => dominio.trim().toLowerCase())
  .filter(Boolean)

export function emailPermitidoParaCadastro(email: string): boolean {
  if (dominiosPermitidos.length === 0) {
    // Sem lista configurada: não bloqueia (conveniência em desenvolvimento
    // local), mas isso deixa o cadastro aberto a qualquer e-mail.
    console.warn(
      "ALLOWED_STUDENT_EMAIL_DOMAINS não configurado - cadastro de contas sem restrição de domínio nesta instância."
    )
    return true
  }

  const dominioDoEmail = email.trim().toLowerCase().split("@")[1]
  if (!dominioDoEmail) return false

  return dominiosPermitidos.includes(dominioDoEmail)
}
