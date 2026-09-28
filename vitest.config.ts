import { defineConfig } from "vitest/config"

// Configuração mínima do Vitest para este projeto - só testes unitários de
// funções puras (sem DOM, sem banco, sem rede) por enquanto, então o
// ambiente "node" é suficiente.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
})
