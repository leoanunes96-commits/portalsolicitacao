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
- **Minhas Solicitações** — o(a) discente consulta o status das próprias solicitações pelo e-mail usado no envio.
- **Área administrativa (`/admin`)** — visão de todas as solicitações, separadas por tipo, com atualização de status, registro de observações e exclusão. Acesso restrito por um código simples (ver [Configuração](#configuração)).

Fluxo "Emissão de Declaração" existe no código mas está desativado na tela inicial — fora do escopo dos 3 fluxos-piloto.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (componentes sobre [Radix UI](https://www.radix-ui.com/))
- [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) para validação de formulários
- [Prisma](https://www.prisma.io/) + [Supabase](https://supabase.com/) (Postgres) para persistência
- [Resend](https://resend.com/) para envio de e-mail
- [pdf-lib](https://pdf-lib.js.org/) para geração de PDF

## Estrutura do projeto

```
app/
  page.tsx                      Tela inicial (lista de fluxos disponíveis)
  ajuste-matricula/             Fluxo: Ajuste de Matrícula
  quebra-pre-requisito/         Fluxo: Quebra de Pré-Requisito
  envio-atestado/               Fluxo: Envio de Atestado
  minhas-solicitacoes/          Consulta de status por e-mail
  admin/                        Área administrativa (todas as solicitações)
  api/                          Rotas de API (envio de cada fluxo, consulta, admin)
components/                     Componentes de UI e formulários
lib/                            Client do Prisma, regras de persistência, auth do admin
prisma/                         Esquema do banco (schema.prisma) e migrações
docs/                           Documentos de decisões técnicas do projeto
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
   ADMIN_ACCESS_CODE=       # código de acesso à área /admin
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

Sem `DATABASE_URL`/`DIRECT_URL` configuradas, a aplicação continua funcionando (envio de e-mail normalmente), só que sem persistência — "Minhas Solicitações" e "Admin" não terão dados para mostrar. Sem `ADMIN_ACCESS_CODE`, a área `/admin` fica acessível sem senha (uso local/desenvolvimento apenas).

## Documentação de decisões

O histórico de decisões técnicas do projeto está registrado em:

- [`docs/decisoes-modulo2.md`](docs/decisoes-modulo2.md) — adequação do código e stack ao escopo do projeto.
- [`docs/decisoes-banco-de-dados.md`](docs/decisoes-banco-de-dados.md) — modelagem do banco, escolha de Supabase + Prisma e configuração passo a passo.
