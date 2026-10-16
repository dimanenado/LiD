import { createContext, useContext } from 'react'
import type { Question } from './data'

export type TransLang = 'en' | 'tr' | 'ru'

export interface Text {
  q: string
  options: string[]
}

export const LANGS: Record<TransLang, { code: string; name: string; native: string; image: string }> = {
  en: { code: 'EN', name: 'English', native: 'English', image: 'Image' },
  tr: { code: 'TR', name: 'Turkish', native: 'Türkçe', image: 'Resim' },
  ru: { code: 'RU', name: 'Russian', native: 'Русский', image: 'Изображение' },
}

export const isTransLang = (v: unknown): v is TransLang => typeof v === 'string' && v in LANGS

type Table = Record<string, Text>

// English ships inside questions.json; other languages load only when picked
export const LOADERS: Record<Exclude<TransLang, 'en'>, () => Promise<{ default: Table }>> = {
  tr: () => import('./data/translations/tr.json'),
  ru: () => import('./data/translations/ru.json'),
}
export const loaded: Partial<Record<TransLang, Table>> = {}

export interface Translation {
  lang: TransLang
  /** show the translation next to the German text */
  show: boolean
  /** the question in the chosen language; undefined while that language loads */
  text: (q: Question) => Text | undefined
}

export const Ctx = createContext<Translation>({ lang: 'en', show: true, text: (q) => q.en })

export const useTranslation = () => useContext(Ctx)
