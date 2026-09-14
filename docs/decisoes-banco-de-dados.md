# Decisões — Integração com banco de dados

Este documento registra a decisão e a implementação da camada de persistência adicionada ao projeto, motivada por dois requisitos que estavam pendentes desde o Módulo 1 (inspeção de artefatos):

- **RF3** — painel de status por solicitação (recebido / em análise / deferido / indeferido).
- **RNF3** — toda mudança de status registrada para auditoria.

Até aqui a aplicação só enviava e-mail (RF4); nada era salvo em lugar nenhum, então não havia como consultar status depois nem auditar mudanças.

## Stack escolhida: Supabase (Postgres) + Prisma

Opções consideradas foram apresentadas ao Léo (Supabase+Prisma, SQLite local, Firebase/Firestore); a escolha foi **Supabase (Postgres gerenciado, plano free) + Prisma como ORM**. Motivos:

- Postgres é um banco relacional "de verdade" — mais alinhado ao que a disciplina espera de um projeto de TI (não é um mock).
- Supabase oferece Postgres gerenciado gratuito sem precisar manter servidor de banco.
- Prisma tem integração de primeira classe com Next.js, gera tipos TypeScript automaticamente a partir do schema, e migrações versionadas (`prisma migrate`) — o que documenta a evolução do banco de forma parecida com um histórico de commits.

## Modelagem (`prisma/schema.prisma`)

Duas entidades:

- **`Solicitacao`** — um registro por solicitação enviada, com os campos comuns aos 3 fluxos (`tipoFluxo`, `statusSolicitacao`, `nomeCompleto`, `matricula`, `telefone`, `email`, datas) e um campo `dadosEspecificos` do tipo `Json` guardando o que é específico de cada fluxo (ex.: código da disciplina na quebra de pré-requisito, docentes selecionados no atestado). Optou-se por uma tabela única com JSON em vez de uma tabela por fluxo — segue a regra do projeto de "priorizar simplicidade sobre engenharia demais" (ver `CLAUDE.md`), já que os 3 fluxos-piloto têm poucos campos específicos cada.
- **`HistoricoStatusSolicitacao`** — uma linha por mudança de status (`statusAnterior`, `statusNovo`, `observacao`, `alteradoEm`), ligada à solicitação. É o que atende ao RNF3 (auditoria): mesmo que o campo `statusSolicitacao` da solicitação seja sobrescrito, o histórico completo continua registrado.

Dois enums (`TipoFluxo`, `StatusSolicitacao`) fixam os valores válidos e evitam strings soltas no código.

## Padrão de escrita: best-effort, nunca bloqueante

`lib/solicitacoes.ts` expõe `registrarSolicitacao()` e `marcarEmailEnviado()`. As duas funções:

- Verificam se `DATABASE_URL` está configurada; se não estiver, apenas retornam (sem erro).
- Envolvem a escrita no banco em `try/catch`; se falhar, logam o erro no console e seguem adiante.

Isso é deliberado: o envio de e-mail (RF4) é hoje o mecanismo de notificação que já funciona e está em produção (na prática, para o Léo). O banco de dados é uma camada adicional — se o Supabase estiver fora do ar, mal configurado, ou a variável de ambiente ausente, uma solicitação ainda deve ser recebida por e-mail normalmente. Nenhuma rota de API passou a depender do banco para funcionar.

## Onde isso entra no código

- `app/api/enviar-solicitacao/route.ts`, `app/api/enviar-atestado/route.ts`, `app/api/enviar-quebra-pre-requisito/route.ts` — cada rota agora chama `registrarSolicitacao(...)` antes de montar o e-mail, e `marcarEmailEnviado(id)` depois de enviar com sucesso.
- `app/api/solicitacoes/route.ts` (novo) — `GET /api/solicitacoes?email=...` retorna as solicitações daquele e-mail com o histórico de status incluído, ordenadas da mais recente para a mais antiga.
- `components/painel-solicitacoes.tsx` + `app/minhas-solicitacoes/page.tsx` (novos) — tela "Minhas Solicitações": o aluno digita o e-mail usado no formulário e vê suas solicitações com status atual (badge colorida) e o histórico de mudanças.
- `app/page.tsx` — botão "Minhas Solicitações" adicionado ao cabeçalho da tela inicial.

## Gap conhecido: login (RNF1)

RNF1 (login pela conta institucional) continua mockado/não implementado. Como a tela "Minhas Solicitações" precisa filtrar por identidade de alguma forma, ela usa **busca por e-mail digitado livremente** — não é uma sessão autenticada, é um substituto temporário. Qualquer pessoa que souber o e-mail de outra pode ver as solicitações dela. Isso é aceitável para o estágio atual do projeto (MVP de disciplina), mas deve ficar registrado como pendência de segurança para quando RNF1 for implementado de fato.

## Gap conhecido: dados incompletos no fluxo de atestado médico

O formulário de atestado médico/segunda chamada não coleta `matrícula` nem `telefone` do aluno hoje. Esses campos ficam `null` no banco para solicitações desse fluxo. Fica como decisão em aberto: expandir o formulário para coletar esses dados, ou aceitar que esse fluxo específico não os tenha.

## Como configurar (para o Léo rodar no próprio computador)

1. Criar um projeto gratuito em https://supabase.com (New Project).
2. Em **Project Settings → Database → Connection string**, copiar:
   - a **connection string em modo "Transaction" / pooled** (porta `6543`) → variável `DATABASE_URL`;
   - a **connection string direta** (porta `5432`) → variável `DIRECT_URL` (usada só pelo Prisma ao migrar, não em tempo de execução).
3. Criar um arquivo `.env.local` na raiz do repositório (já está no `.gitignore`, não é versionado) com:
   ```
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...:5432/postgres"
   RESEND_API_KEY="..."   # se já não estiver lá
   ```
   (ver `.env.example` no repositório para o formato exato).
4. Rodar, no terminal do VS Code (Windows, onde o `node_modules` real do projeto está instalado):
   ```
   npm install
   npx prisma migrate dev --name init
   ```
   O primeiro comando instala `@prisma/client`/`prisma` (adicionados ao `package.json`) e gera o client do Prisma via `postinstall`. O segundo cria as tabelas no Supabase a partir do `prisma/schema.prisma` e gera a primeira migração versionada em `prisma/migrations/`.
5. Depois disso, `npm run dev` já persiste as solicitações e a tela "Minhas Solicitações" passa a mostrar dados reais.

Essa etapa não foi executada pela sessão do Cowork porque exige credenciais reais do Supabase (que devem ficar só no ambiente do Léo, nunca digitadas no chat) e um `npm install` que só é seguro de rodar no ambiente Windows real do projeto (a ponte de dispositivo usada por esta sessão roda em uma VM Linux e o `node_modules` atual foi instalado para Windows — instalar pacotes por ali arriscaria corromper o `node_modules` real).
