# Checklist de testes manuais (regressão)

Roteiro de testes manuais dos três fluxos-piloto e da área administrativa.
Serve tanto para validar uma funcionalidade nova quanto para regressão -
repetir os itens relevantes sempre que uma alteração for feita em código
compartilhado (ex.: `lib/form-utils.ts`, `components/painel-admin.tsx`,
`components/painel-solicitacoes.tsx`), para garantir que a mudança não
quebrou algo que já funcionava.

## Ajuste de Matrícula

- [ ] Matrícula com menos ou mais de 10 dígitos é rejeitada (mensagem de erro exibida)
- [ ] Digitar letras no campo de matrícula não tem efeito (o caractere não aparece)
- [ ] Telefone com 9 dígitos é rejeitado; com 10 e com 11 dígitos é aceito
- [ ] Código da disciplina fora do padrão (ex.: `AB1234`, `FON123`) é rejeitado
- [ ] Código da disciplina digitado em minúsculas aparece automaticamente em maiúsculas
- [ ] Envio sem selecionar o arquivo do formulário assinado é bloqueado
- [ ] Envio completo com todos os campos válidos é aceito e mostra a tela de sucesso
- [ ] A solicitação enviada aparece em "Minhas Solicitações" com o e-mail da sessão autenticada (nunca um e-mail digitado à mão)
- [ ] O título em "Minhas Solicitações" mostra o subtipo correto ("Abertura de Vaga" ou "Abertura de Escopo")
- [ ] O e-mail chega para o endereço configurado em `ADMIN_NOTIFICATION_EMAIL`, com o anexo do formulário assinado

## Quebra de Pré-Requisito

- [ ] Mesmas validações de matrícula, telefone e código da disciplina do Ajuste de Matrícula (reaproveitam `lib/form-utils.ts`)
- [ ] Envio é bloqueado se a caixa "Declaro estar ciente dos critérios acima" não estiver marcada
- [ ] Envio sem o formulário assinado é bloqueado
- [ ] Envio sem o histórico parcial é bloqueado (campo obrigatório)
- [ ] Envio completo é aceito e o e-mail chega com os dois anexos (formulário + histórico)

## Envio de Atestado

- [ ] Matrícula validada (exatamente 10 dígitos numéricos, só números aceitos na digitação)
- [ ] Envio sem o atestado médico é bloqueado
- [ ] Envio sem o comprovante de matrícula é bloqueado
- [ ] Ao marcar "Perdi atividade avaliativa e desejo solicitar segunda chamada", o campo de descrição aparece
- [ ] Envio completo notifica todos os docentes selecionados, com cópia para o aluno

## Área administrativa (`/admin`)

- [ ] Login com usuário/senha errados mostra mensagem de erro e não entra
- [ ] As solicitações aparecem agrupadas corretamente por tipo de fluxo (abas)
- [ ] Alterar o status para cada um dos 5 valores (Recebido, Em análise, Diligência pendente, Deferido, Indeferido) salva sem erro
- [ ] A observação digitada ao mudar o status é salva e aparece no histórico da solicitação (tanto no admin quanto em "Minhas Solicitações" do aluno)
- [ ] As cores dos status seguem o padrão definido: Recebido = verde claro/letra preta; Em análise = amarelo/letra preta; Diligência pendente = vermelho claro/letra preta; Deferido = verde escuro/letra branca; Indeferido = vermelho escuro/letra branca
- [ ] Excluir uma solicitação exige confirmação e, após excluída, ela desaparece da lista (e seu histórico é removido em cascata no banco)

## Regressão geral (repetir a cada lote de alterações)

- [ ] Cadastro de conta, login e logout continuam funcionando
- [ ] Fluxo de "esqueci minha senha" continua funcionando de ponta a ponta (link do e-mail → redefinição → mensagem de sucesso)
- [ ] As três solicitações continuam sendo persistidas no banco (Supabase) e o e-mail via Resend continua sendo enviado
- [ ] `npm run lint` não aponta novos erros
- [ ] `npm test` (testes automatizados, ver `lib/form-utils.test.ts`) passa sem falhas
