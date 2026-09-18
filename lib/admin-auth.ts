// Verificação de acesso à área administrativa (/admin). NÃO é um sistema de
// login real como o Supabase Auth usado pelos discentes - é uma conta única
// e fixa (usuário + senha), guardada em variáveis de ambiente, só para não
// deixar a área de administração (onde é possível alterar status e excluir
// solicitações) completamente aberta enquanto não existir autenticação de
// verdade (com papéis/roles) para a equipe técnico-administrativa.
export function verificarLoginAdmin(request: Request): boolean {
  const loginConfigurado = process.env.ADMIN_LOGIN
  const senhaConfigurada = process.env.ADMIN_SENHA

  if (!loginConfigurado || !senhaConfigurada) {
    // Sem credenciais configuradas nesta instância: não bloqueia (conveniência
    // em desenvolvimento local), mas avisa no log do servidor.
    console.warn(
      "ADMIN_LOGIN/ADMIN_SENHA não configurados - área administrativa sem proteção nesta instância."
    )
    return true
  }

  const loginRecebido = request.headers.get("x-admin-login")
  const senhaRecebida = request.headers.get("x-admin-senha")

  return loginRecebido === loginConfigurado && senhaRecebida === senhaConfigurada
}
