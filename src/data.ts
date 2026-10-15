import raw from './data/questions.json'

export type Topic = 'politics' | 'history' | 'society' | 'state'

export interface Question {
  id: string
  state: string | null
  number: number
  de: { q: string; options: string[] }
  en: { q: string; options: string[] }
  correct: number
  topic: Topic
  credit?: string
  image?: string
  optionImages?: string[]
  answerStatus: 'draft' | 'verified'
}

export const QUESTIONS = raw as Question[]
export const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))
export const GENERAL = QUESTIONS.filter((q) => q.state === null)

export const STATES: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
}

export const TOPIC_LABELS: Record<Topic, string> = {
  politics: 'Politics in a democracy',
  history: 'History and responsibility',
  society: 'People and society',
  state: 'Your state',
}

/** correct answers needed to pass the Einbürgerungstest */
export const PASS = 17

export const TOPIC_SHORT: Record<Exclude<Topic, 'state'>, string> = {
  politics: 'Politics',
  history: 'History',
  society: 'Society',
}

export const questionRef = (q: Question) => (q.state ? `${STATES[q.state]} · No. ${q.number}` : `No. ${q.number}`)

export const stateQuestions = (state: string) => QUESTIONS.filter((q) => q.state === state)

export const imageUrl = (file: string) => `${import.meta.env.BASE_URL}images/${file}`

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
