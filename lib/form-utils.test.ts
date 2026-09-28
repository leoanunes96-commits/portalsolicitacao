import { describe, expect, it } from "vitest"
import {
  REGEX_MATRICULA,
  REGEX_TELEFONE,
  REGEX_CODIGO_DISCIPLINA,
  somenteNumeros,
  formatarCodigoDisciplina,
} from "./form-utils"

// Testes unitários das regras de validação/formatação usadas nos três
// formulários de solicitação (Ajuste de Matrícula, Quebra de Pré-Requisito e
// Envio de Atestado). Como são funções puras, sem dependência de banco, rede
// ou DOM, cobrem exatamente o que a Unidade 1 do Módulo 4 chama de teste
// automatizado: validar o comportamento sem intervenção manual, podendo ser
// executados a cada alteração de código (regressão) e em CI.

describe("REGEX_MATRICULA", () => {
  it("aceita exatamente 10 dígitos numéricos", () => {
    expect(REGEX_MATRICULA.test("2021123456")).toBe(true)
  })

  it("rejeita menos de 10 dígitos", () => {
    expect(REGEX_MATRICULA.test("202112345")).toBe(false)
  })

  it("rejeita mais de 10 dígitos", () => {
    expect(REGEX_MATRICULA.test("20211234567")).toBe(false)
  })

  it("rejeita valores com letras ou símbolos", () => {
    expect(REGEX_MATRICULA.test("202112345A")).toBe(false)
    expect(REGEX_MATRICULA.test("2021-12345")).toBe(false)
  })
})

describe("REGEX_TELEFONE", () => {
  it("aceita 10 dígitos (telefone fixo)", () => {
    expect(REGEX_TELEFONE.test("2733334444")).toBe(true)
  })

  it("aceita 11 dígitos (celular)", () => {
    expect(REGEX_TELEFONE.test("27999998888")).toBe(true)
  })

  it("rejeita 9 dígitos", () => {
    expect(REGEX_TELEFONE.test("999998888")).toBe(false)
  })

  it("rejeita 12 dígitos", () => {
    expect(REGEX_TELEFONE.test("279999988881")).toBe(false)
  })

  it("rejeita valores com letras ou símbolos", () => {
    expect(REGEX_TELEFONE.test("(27) 99999-8888")).toBe(false)
  })
})

describe("REGEX_CODIGO_DISCIPLINA", () => {
  it("aceita 3 letras maiúsculas seguidas de 5 números", () => {
    expect(REGEX_CODIGO_DISCIPLINA.test("FON12345")).toBe(true)
  })

  it("rejeita letras minúsculas (o código já chega em maiúsculas via formatarCodigoDisciplina)", () => {
    expect(REGEX_CODIGO_DISCIPLINA.test("fon12345")).toBe(false)
  })

  it("rejeita quantidade errada de letras ou números", () => {
    expect(REGEX_CODIGO_DISCIPLINA.test("FO12345")).toBe(false)
    expect(REGEX_CODIGO_DISCIPLINA.test("FON1234")).toBe(false)
    expect(REGEX_CODIGO_DISCIPLINA.test("FONN12345")).toBe(false)
  })
})

describe("somenteNumeros", () => {
  it("remove tudo que não é dígito", () => {
    expect(somenteNumeros("(27) 99999-8888", 11)).toBe("27999998888")
  })

  it("corta no tamanho máximo informado", () => {
    expect(somenteNumeros("999999999999999", 10)).toBe("9999999999")
  })

  it("mantém string vazia se não houver dígitos", () => {
    expect(somenteNumeros("abc", 10)).toBe("")
  })
})

describe("formatarCodigoDisciplina", () => {
  it("converte letras minúsculas para maiúsculas", () => {
    expect(formatarCodigoDisciplina("fon12345")).toBe("FON12345")
  })

  it("remove espaços e símbolos", () => {
    expect(formatarCodigoDisciplina("FON 12345!")).toBe("FON12345")
  })

  it("corta em 8 caracteres", () => {
    expect(formatarCodigoDisciplina("FONABC123456789")).toBe("FONABC12")
  })
})
