export interface Docente {
  id: string
  nome: string
  email: string
  disciplinas: string[]
}

export const docentes: Docente[] = [
  {
    id: "1",
    nome: "Prof. Dr. Carlos Eduardo Mendes",
    email: "carlos.mendes@colegiado.edu.br",
    disciplinas: ["Cálculo I", "Álgebra Linear"],
  },
  {
    id: "2",
    nome: "Profa. Dra. Ana Paula Ferreira",
    email: "ana.ferreira@colegiado.edu.br",
    disciplinas: ["Estrutura de Dados", "Algoritmos"],
  },
  {
    id: "3",
    nome: "Prof. Dr. Roberto Silva Santos",
    email: "roberto.santos@colegiado.edu.br",
    disciplinas: ["Banco de Dados", "Engenharia de Software"],
  },
  {
    id: "4",
    nome: "Profa. Dra. Maria Clara Oliveira",
    email: "maria.oliveira@colegiado.edu.br",
    disciplinas: ["Redes de Computadores", "Sistemas Operacionais"],
  },
  {
    id: "5",
    nome: "Prof. Dr. Fernando Augusto Lima",
    email: "fernando.lima@colegiado.edu.br",
    disciplinas: ["Programação Orientada a Objetos", "Desenvolvimento Web"],
  },
  {
    id: "6",
    nome: "Profa. Dra. Juliana Costa Ribeiro",
    email: "juliana.ribeiro@colegiado.edu.br",
    disciplinas: ["Metodologia Científica", "Comunicação e Expressão"],
  },
  {
    id: "7",
    nome: "Prof. Dr. Paulo Henrique Souza",
    email: "paulo.souza@colegiado.edu.br",
    disciplinas: ["Inteligência Artificial", "Aprendizagem de Máquina"],
  },
  {
    id: "8",
    nome: "Profa. Dra. Camila Rodrigues",
    email: "camila.rodrigues@colegiado.edu.br",
    disciplinas: ["Estatística", "Probabilidade"],
  },
  {
    id: "9",
    nome: "Prof. Dr. Lucas Martins Pereira",
    email: "lucas.pereira@colegiado.edu.br",
    disciplinas: ["Gestão de Projetos", "Políticas Públicas em TI"],
  },
  {
    id: "10",
    nome: "Profa. Dra. Beatriz Almeida",
    email: "beatriz.almeida@colegiado.edu.br",
    disciplinas: ["Arquitetura de Computadores", "Sistemas Distribuídos"],
  },
  {
    id: "11",
    nome: "Prof. Dr. Marcos Antônio Viana",
    email: "marcos.viana@colegiado.edu.br",
    disciplinas: ["Segurança da Informação", "Criptografia"],
  },
  {
    id: "12",
    nome: "Profa. Dra. Renata Carvalho",
    email: "renata.carvalho@colegiado.edu.br",
    disciplinas: ["Interação Humano-Computador", "Design de Software"],
  },
]
