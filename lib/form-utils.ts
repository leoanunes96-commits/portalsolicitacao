// Funções auxiliares de formatação/validação de campos usados em mais de um
// formulário de solicitação (matrícula, telefone e código de disciplina).
// Centralizadas aqui para manter o mesmo comportamento - o que o campo aceita
// digitar e o que é validado no envio (front e back-end) - igual em todos os
// formulários que usam esses campos.

// Matrícula: exatamente 10 dígitos numéricos.
export const REGEX_MATRICULA = /^\d{10}$/

// Telefone: 10 ou 11 dígitos numéricos (fixo ou celular, com DDD, sem
// parênteses/hífen - só os números).
export const REGEX_TELEFONE = /^\d{10,11}$/

// Código da disciplina: 3 letras seguidas de 5 números (ex.: FON12345).
export const REGEX_CODIGO_DISCIPLINA = /^[A-Z]{3}[0-9]{5}$/

// Filtra o valor digitado para manter só números, limitando ao tamanho
// máximo esperado. Usado no onChange dos campos de matrícula e telefone
// para impedir a digitação de letras/símbolos, em vez de só validar no envio.
export function somenteNumeros(valor: string, tamanhoMaximo: number) {
  return valor.replace(/\D/g, "").slice(0, tamanhoMaximo)
}

// Filtra o valor digitado do código da disciplina: mantém só letras e
// números, converte para maiúsculas e limita a 8 caracteres (3 letras + 5
// números) - o mesmo formato do exemplo mostrado no campo (ex.: FON12345).
export function formatarCodigoDisciplina(valor: string) {
  return valor
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8)
}
