import { useCallback, useEffect, useState } from 'react'

export interface QStat {
  seen: number
  correct: number
  wrong: number
  /** consecutive correct answers; one right answer clears a mistake, two count as mastered */
  streak: number
  last: number
}

export interface ExamResult {
  date: number
  state: string
  score: number
  total: number
  seconds: number
}

export interface Progress {
  state: string
  showEnglish: boolean
  /** shuffle practice sets (exam is always random) */
  shuffle: boolean
  /** the user picked a state at least once; hides the welcome screen */
  onboarded: boolean
  stats: Record<string, QStat>
  exams: ExamResult[]
}

const KEY = 'lid-prep:v1'
const DEFAULT: Progress = { state: 'BE', showEnglish: true, shuffle: true, onboarded: false, stats: {}, exams: [] }

function load(): Progress {
  try {
    const s = localStorage.getItem(KEY)
    if (s) {
      // progress saved before the redesign has no "onboarded" flag; those users already chose a state
      return { ...DEFAULT, onboarded: true, ...JSON.parse(s) }
    }
  } catch {
    /* storage unavailable */
  }
  return DEFAULT
}

export const isMistake = (s?: QStat) => !!s && s.wrong > 0 && s.streak === 0
export const isMastered = (s?: QStat) => !!s && s.streak >= 2

export function useProgress() {
  const [p, setP] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      /* storage unavailable */
    }
  }, [p])

  const record = useCallback((id: string, ok: boolean) => {
    setP((prev) => {
      const s = prev.stats[id] ?? { seen: 0, correct: 0, wrong: 0, streak: 0, last: 0 }
      const next: QStat = {
        seen: s.seen + 1,
        correct: s.correct + (ok ? 1 : 0),
        wrong: s.wrong + (ok ? 0 : 1),
        streak: ok ? s.streak + 1 : 0,
        last: Date.now(),
      }
      return { ...prev, stats: { ...prev.stats, [id]: next } }
    })
  }, [])

  const update = useCallback((patch: Partial<Progress>) => setP((prev) => ({ ...prev, ...patch })), [])

  const addExam = useCallback(
    (r: ExamResult) => setP((prev) => ({ ...prev, exams: [r, ...prev.exams].slice(0, 50) })),
    [],
  )

  return { p, record, update, addExam }
}

export type Store = ReturnType<typeof useProgress>
