import { useMemo, useState } from 'react'
import { QUESTIONS, STATES } from './data'
import { QuestionCard } from './QuestionCard'
import { Store } from './store'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Searchable catalog of the general questions plus the selected state's, with answers shown. */
export function Browse({ store, onExit }: { store: Store; onExit: () => void }) {
  const [term, setTerm] = useState('')
  const list = useMemo(() => {
    const t = norm(term.trim())
    return QUESTIONS.filter((q) => q.state === null || q.state === store.p.state).filter(
      (q) =>
        !t ||
        norm([q.de.q, q.en.q, ...q.de.options, ...q.en.options].join(' ')).includes(t) ||
        String(q.number) === t,
    )
  }, [term, store.p.state])

  return (
    <section>
      <header className="sessionbar">
        <button onClick={onExit}>✕</button>
        <strong>All questions · {STATES[store.p.state]}</strong>
        <span>{list.length}</span>
      </header>
      <input
        className="search"
        type="search"
        placeholder="Search in German or English, or a question number"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {list.slice(0, 60).map((q) => (
        <QuestionCard key={q.id} q={q} showEnglish={store.p.showEnglish} selected={null} reveal />
      ))}
      {list.length > 60 && <p className="muted">Showing the first 60 matches. Refine your search to see more.</p>}
    </section>
  )
}
