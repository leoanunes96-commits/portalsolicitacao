# Decisões do Módulo 2 — Portal de Solicitações do Colegiado de Curso

Este documento registra as principais decisões técnicas tomadas durante o desenvolvimento do Módulo 2 da disciplina Projeto Integrador de Tecnologia da Informação, conforme exigido pelo enunciado da atividade.

## 1. Reaproveitamento de um projeto existente e correção de stack

O ponto de partida deste módulo não foi um projeto vazio: já existia uma aplicação web construída anteriormente para fins de estudo pessoal, com uma estrutura de fluxos de solicitação bastante próxima do que este projeto precisa. Optou-se por reaproveitar e adaptar esse código em vez de recomeçar do zero, por ser mais produtivo e por já resolver boa parte dos requisitos funcionais levantados no Módulo 1.

Isso implicou corrigir uma decisão de stack tomada antes de esse código ser (re)descoberto: o plano inicial previa **React + Vite**, front-end isolado, sem backend real. Na prática, o projeto reaproveitado usa:

- **Next.js 16** (App Router) com **React 19**
- **Tailwind CSS v4**
- **shadcn/ui** (componentes construídos sobre primitivas acessíveis do Radix UI)
- **react-hook-form** + **zod** (`@hookform/resolvers/zod`) para validação de formulários
- **resend** para envio de e-mail transacional (com *fallback* silencioso quando a variável de ambiente `RESEND_API_KEY` não está configurada — o formulário continua funcionando e sinaliza `emailSent: false`)
- **pdf-lib** para preenchimento de um modelo de PDF real com os dados da solicitação
- **sonner** para notificações (*toast*) e **lucide-react** para ícones

Ou seja, diferente do que estava previsto, este módulo já entrega mais do que um front-end estático com dados mockados: os três fluxos-piloto têm formulário validado, envio de e-mail (best-effort) e, em um dos fluxos, geração de PDF. Isso não invalida o requisito do módulo (que pede apenas um framework moderno, HTML semântico/acessível e CSS responsivo) — apenas significa que a stack e o nível de completude reais são outros, e este documento existe para deixar essa correção explícita e rastreável.

## 2. Genericidade institucional

Por decisão fixada desde o Módulo 1, o projeto nunca referencia a instituição ou colegiado específico de origem do código reaproveitado. Todo o texto de interface, metadados da página, remetente/destinatário de e-mail e nomes de exemplo (docentes, disciplinas) foram revisados para tratar o sistema como o de um **"Colegiado de Curso" genérico de uma instituição pública federal de ensino superior**, sem citar nomes próprios de instituição, curso ou departamento.

## 3. Escopo: os três fluxos-piloto e o fluxo fora de escopo

O MVP desta disciplina está fixado em três fluxos: aumento de vaga em disciplina lotada, quebra de pré-requisito e atestado médico / pedido de segunda chamada. O código reaproveitado já trazia um quarto fluxo ("Emissão de Declaração") que não faz parte desse escopo. Em vez de removê-lo (o que descartaria trabalho e aumentaria o risco de quebrar algo por engano), ele foi **desativado na tela inicial** (cartão exibido como indisponível, com selo "Em breve"), mantendo o código no repositório para uma eventual decisão futura, sem expandir o escopo combinado sem aviso prévio.

Dos três fluxos do escopo, dois já existiam prontos (aumento de vaga, atestado médico) e passaram apenas por ajustes de generalização institucional e, no caso do atestado, pela adição do pedido de segunda chamada de avaliação (checkbox + campo condicional descrevendo a atividade perdida) — funcionalidade prevista nos requisitos, mas ainda não implementada no fluxo original.

O terceiro fluxo, **quebra de pré-requisito**, não existia e foi implementado neste módulo: formulário (dados pessoais, disciplina, justificativa, upload do formulário assinado e, opcionalmente, do histórico parcial), página de rota e endpoint de API que envia a solicitação por e-mail à coordenação com os arquivos em anexo, seguindo o mesmo padrão dos outros dois fluxos.

## 4. Acessibilidade e HTML semântico

- Uso de landmarks (`header`, `main`, `footer`) e hierarquia de headings coerente (`h1`/`h2`/`h3`) em cada página.
- Cada campo de formulário usa um componente de rótulo associado ao input pelo atributo `htmlFor`/`id` (padrão já estabelecido pelo componente `FieldLabel` do shadcn/ui), e não apenas texto solto perto do campo.
- Os componentes de formulário e diálogo do shadcn/ui são construídos sobre primitivas do Radix UI, que já tratam papéis (`role`) e atributos ARIA relevantes; não foi necessário adicionar ARIA manual além do que esses componentes já oferecem.
- Mensagens de erro de validação (zod) são renderizadas como texto associado ao campo correspondente, não apenas por cor.

## 5. Responsividade

O CSS é feito com Tailwind, usando breakpoints (`sm:`, `lg:`) para adaptar grids e formulários entre celular e telas maiores — por exemplo, a grade de cartões de serviço na tela inicial vai de uma coluna no celular para múltiplas colunas em telas maiores, e os campos de formulário que ficam lado a lado em telas largas (ex.: telefone/e-mail, código/nome da disciplina) empilham em uma coluna em telas estreitas.

## 6. Pendências conhecidas (não bloqueiam a entrega deste módulo)

- Visão arquitetural formal do sistema (ex.: diagrama front-end atual → futura API → futuro banco) ainda não existe como artefato dedicado.
- Critérios de aceite (regras de deferimento/indeferimento) por fluxo ainda não foram definidos.
- A reunião de diagnóstico com líderes de turma, que deveria validar os requisitos levantados no Módulo 1, ainda não foi realizada — os requisitos funcionais e não funcionais usados como referência continuam sendo tratados como hipótese de trabalho.
