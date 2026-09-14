-- CreateEnum
CREATE TYPE "TipoFluxo" AS ENUM ('AJUSTE_MATRICULA', 'QUEBRA_PRE_REQUISITO', 'ATESTADO_MEDICO');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('RECEBIDO', 'EM_ANALISE', 'DEFERIDO', 'INDEFERIDO');

-- CreateTable
CREATE TABLE "Solicitacao" (
    "id" TEXT NOT NULL,
    "tipoFluxo" "TipoFluxo" NOT NULL,
    "statusSolicitacao" "StatusSolicitacao" NOT NULL DEFAULT 'RECEBIDO',
    "nomeCompleto" TEXT NOT NULL,
    "matricula" TEXT,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "dadosEspecificos" JSONB NOT NULL,
    "emailNotificacaoEnviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoStatusSolicitacao" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "statusAnterior" "StatusSolicitacao",
    "statusNovo" "StatusSolicitacao" NOT NULL,
    "observacao" TEXT,
    "alteradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoStatusSolicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Solicitacao_email_idx" ON "Solicitacao"("email");

-- CreateIndex
CREATE INDEX "Solicitacao_tipoFluxo_idx" ON "Solicitacao"("tipoFluxo");

-- CreateIndex
CREATE INDEX "HistoricoStatusSolicitacao_solicitacaoId_idx" ON "HistoricoStatusSolicitacao"("solicitacaoId");

-- AddForeignKey
ALTER TABLE "HistoricoStatusSolicitacao" ADD CONSTRAINT "HistoricoStatusSolicitacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "Solicitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
