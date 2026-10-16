import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Ctx, LOADERS, TransLang, Translation, loaded } from './i18n'

/** Gives the app the chosen translation; loads a language's file the first time it is picked. */
export function TranslationProvider({ lang, show, children }: { lang: TransLang; show: boolean; children: ReactNode }) {
  // bumped when a language finishes loading, so the context value changes
  const [, setReady] = useState(0)

  useEffect(() => {
    if (lang === 'en' || loaded[lang]) return
    let live = true
    LOADERS[lang]().then((m) => {
      loaded[lang] = m.default
      if (live) setReady((n) => n + 1)
    })
    return () => {
      live = false
    }
  }, [lang])

  const table = loaded[lang]
  const value = useMemo<Translation>(
    () => ({ lang, show, text: lang === 'en' ? (q) => q.en : (q) => table?.[q.id] }),
    [lang, show, table],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
