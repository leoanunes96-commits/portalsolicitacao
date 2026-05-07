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
    email: "carlos.mendes@ufes.br",
    disciplinas: ["Anatomia da Cabeça e Pescoço", "Fisiologia da Audição"],
  },
  {
    id: "2",
    nome: "Profa. Dra. Ana Paula Ferreira",
    email: "ana.ferreira@ufes.br",
    disciplinas: ["Linguística Aplicada", "Desenvolvimento da Linguagem"],
  },
  {
    id: "3",
    nome: "Prof. Dr. Roberto Silva Santos",
    email: "roberto.santos@ufes.br",
    disciplinas: ["Audiologia Clínica", "Processamento Auditivo"],
  },
  {
    id: "4",
    nome: "Profa. Dra. Maria Clara Oliveira",
    email: "maria.oliveira@ufes.br",
    disciplinas: ["Motricidade Orofacial", "Disfagia"],
  },
  {
    id: "5",
    nome: "Prof. Dr. Fernando Augusto Lima",
    email: "fernando.lima@ufes.br",
    disciplinas: ["Voz Profissional", "Reabilitação Vocal"],
  },
  {
    id: "6",
    nome: "Profa. Dra. Juliana Costa Ribeiro",
    email: "juliana.ribeiro@ufes.br",
    disciplinas: ["Fonoaudiologia Educacional", "Alfabetização e Letramento"],
  },
  {
    id: "7",
    nome: "Prof. Dr. Paulo Henrique Souza",
    email: "paulo.souza@ufes.br",
    disciplinas: ["Neurologia da Comunicação", "Afasias"],
  },
  {
    id: "8",
    nome: "Profa. Dra. Camila Rodrigues",
    email: "camila.rodrigues@ufes.br",
    disciplinas: ["Fonoaudiologia Hospitalar", "UTI Neonatal"],
  },
  {
    id: "9",
    nome: "Prof. Dr. Lucas Martins Pereira",
    email: "lucas.pereira@ufes.br",
    disciplinas: ["Saúde Coletiva", "Políticas Públicas em Saúde"],
  },
  {
    id: "10",
    nome: "Profa. Dra. Beatriz Almeida",
    email: "beatriz.almeida@ufes.br",
    disciplinas: ["Gerontologia", "Fonoaudiologia no Envelhecimento"],
  },
  {
    id: "11",
    nome: "Prof. Dr. Marcos Antônio Viana",
    email: "marcos.viana@ufes.br",
    disciplinas: ["Prótese Auditiva", "Implante Coclear"],
  },
  {
    id: "12",
    nome: "Profa. Dra. Renata Carvalho",
    email: "renata.carvalho@ufes.br",
    disciplinas: ["Fluência", "Gagueira"],
  },
]
