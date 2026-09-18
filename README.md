# Portal de Solicitações

Aplicação web para centralizar solicitações discentes (hoje enviadas por e-mail, formulário físico ou presencialmente) em um único lugar, com acompanhamento de status e fluxo de aprovação mais automático e confiável.

Projeto acadêmico desenvolvido como parte do curso de Tecnologia da Informação, nos módulos de Projeto Integrador (análise de requisitos, desenvolvimento web e integração com banco de dados).

## Funcionalidades

- **Abertura de solicitações** em 3 fluxos-piloto:
  - Ajuste de Matrícula (abertura de vaga / abertura de escopo em disciplina)
  - Quebra de Pré-Requisito
  - Envio de Atestado (médico ou pedido de segunda chamada)
- **Geração automática de PDF** e **envio por e-mail** (via [Resend](https://resend.com)) a cada solicitação enviada.
- **Persistência em banco de dados** (Postgres via Supabase + Prisma): toda solicitação é registrada, com histórico de mudanças de status para auditoria.
- **Login (`/login`)** — autenticação por e-mail/senha (Supabase Auth), com cadastro restrito a domínios de e-mail institucionais configuráveis. É a porta de entrada de toda a aplicação: sem sessão ativa, qualquer página (inclusive os formulários de nova solicitação) redireciona para o login.
- **Minhas Solicitações** — cada discente autenticado(a) só vê as próprias solicitações.
- **Área administrativa (`/admin`)** — visão de todas as solicitações, separadas por tipo, com atualização de status, registro de observações e exclusão. Fica de fora do login de discente: acesso restrito por uma conta administrativa única e fixa, à parte (ver [Configuração](#configuração)) - pensada para a equipe técnico-administrativa, não para discentes.

Fluxo "Emissão de Declaração" existe no código mas está desativado na tela inicial — fora do escopo dos 3 fluxos-piloto.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (componentes sobre [Radix UI](https://www.radix-ui.com/))
- [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) para validação de formulários
- [Prisma](https://www.prisma.io/) + [Supabase](https://supabase.com/) (Postgres) para persistência
- [Supabase Auth](https://supabase.com/docs/guides/auth) para login/cadastro de contas
- [Resend](https://resend.com/) para envio de e-mail
- [pdf-lib](https://pdf-lib.js.org/) para geração de PDF

## Estrutura do projeto

```
app/
  page.tsx                      Tela inicial (lista de fluxos disponíveis)
  ajuste-matricula/             Fluxo: Ajuste de Matrícula
  quebra-pre-requisito/         Fluxo: Quebra de Pré-Requisito
  envio-atestado/               Fluxo: Envio de Atestado
  login/                        Tela de login/cadastro (Supabase Auth)
  minhas-solicitacoes/          Consulta de status (protegida por login)
  admin/                        Área administrativa (todas as solicitações)
  api/                          Rotas de API (envio de cada fluxo, consulta, admin, auth)
components/                     Componentes de UI e formulários
lib/                            Clients do Prisma e do Supabase, regras de persistência, auth do admin
prisma/                         Esquema do banco (schema.prisma) e migrações
docs/                           Documentos de decisões técnicas do projeto
middleware.ts                   Renova a sessão de login e protege /minhas-solicitacoes
```

## Configuração

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Criar um arquivo `.env.local` na raiz (veja `.env.example` para o formato completo) com:
   ```
   RESEND_API_KEY=          # opcional; sem ela, o e-mail é só simulado
   DATABASE_URL=            # connection string do Supabase (pooler, porta 6543)
   DIRECT_URL=               # connection string do Supabase para migrações (porta 5432)
   ADMIN_LOGIN=              # usuário da conta administrativa única (área /admin)
   ADMIN_SENHA=              # senha da conta administrativa única (área /admin)
   NEXT_PUBLIC_SUPABASE_URL=        # Project Settings -> API, no mesmo projeto Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=   # idem (chave pública, "anon")
   ALLOWED_STUDENT_EMAIL_DOMAINS=   # domínios que podem criar conta, separados por vírgula
   ```
3. Criar as tabelas no banco (primeira vez):
   ```bash
   npx prisma migrate dev
   ```
4. Rodar em desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse em `http://localhost:3000` (usar `localhost`, não o IP de rede — acessar pelo IP quebra a hidratação do React em dev).

Sem `DATABASE_URL`/`DIRECT_URL` configuradas, a aplicação continua funcionando (envio de e-mail normalmente), só que sem persistência — "Minhas Solicitações" e "Admin" não terão dados para mostrar. Sem `ADMIN_LOGIN`/`ADMIN_SENHA`, a área `/admin` fica acessível sem login (uso local/desenvolvimento apenas). Sem `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, o login não funciona. Sem `ALLOWED_STUDENT_EMAIL_DOMAINS`, o cadastro fica aberto a qualquer e-mail (uso local/desenvolvimento apenas).

## Documentação de decisões

O histórico de decisões técnicas do projeto está registrado em:

- [`docs/decisoes-modulo2.md`](docs/decisoes-modulo2.md) — adequação do código e stack ao escopo do projeto.
- [`docs/decisoes-banco-de-dados.md`](docs/decisoes-banco-de-dados.md) — modelagem do banco, escolha de Supabase + Prisma e configuração passo a passo.
