// Verificação de acesso à área administrativa (/admin). NÃO é um sistema de
// login real — isso depende do RNF1 (login institucional), que ainda é
// mockado neste projeto. É um código de acesso compartilhado, guardado numa
// variável de ambiente, só para não deixar a área de administração (onde é
// possível alterar status e excluir solicitações) completamente aberta
// enquanto o login de verdade não existe. Deve ser substituído por
// autenticação real quando o RNF1 for implementado.
export function verificarCodigoAdmin(request: Request): boolean {
  const codigoConfigurado = process.env.ADMIN_ACCESS_CODE

  if (!codigoConfigurado) {
    // Sem código configurado nesta instância: não bloqueia (conveniência em
    // desenvolvimento local), mas avisa no log do servidor.
    console.warn(
      "ADMIN_ACCESS_CODE não configurado - área administrativa sem proteção nesta instância."
    )
    return true
  }

  const codigoRecebido = request.headers.get("x-admin-code")
  return codigoRecebido === codigoConfigurado
}
