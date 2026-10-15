import { useEffect, useState } from 'react'
import { BY_ID } from './data'
import { QuestionCard } from './QuestionCard'
import { Store } from './store'

interface Props {
  title: string
  ids: string[]
  store: Store
  onExit: () => void
}

/** Answer one question at a time with immediate feedback. */
export function Practice({ title, ids, store, onExit }: Props) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState({ right: 0, wrong: 0 })

  const q = BY_ID.get(ids[idx])
  const answered = selected !== null

  const choose = (i: number) => {
    if (answered || !q) return
    setSelected(i)
    const ok = i === q.correct
    store.record(q.id, ok)
    setScore((s) => (ok ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }))
  }

  const next = () => {
    setSelected(null)
    setIdx((i) => i + 1)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!answered && ['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1)
      else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (ids.length === 0) {
    return (
      <section>
        <h2>{title}</h2>
        <p>Nothing to practise here yet.</p>
        <button onClick={onExit}>Back</button>
      </section>
    )
  }

  if (!q) {
    return (
      <section className="done">
        <h2>{title}: done</h2>
        <p>
          {score.right} correct, {score.wrong} wrong out of {ids.length}.
        </p>
        <button className="primary" onClick={onExit}>
          Back to home
        </button>
      </section>
    )
  }

  return (
    <section>
      <header className="sessionbar">
        <button onClick={onExit}>✕</button>
        <strong>{title}</strong>
        <span>
          {idx + 1} / {ids.length} · ✓ {score.right} · ✗ {score.wrong}
        </span>
      </header>
      <div className="progressline" style={{ width: `${(idx / ids.length) * 100}%` }} />
      <QuestionCard
        q={q}
        showEnglish={store.p.showEnglish}
        selected={selected}
        reveal={answered}
        onSelect={answered ? undefined : choose}
      />
      {answered && (
        <div className="feedback">
          <span className={selected === q.correct ? 'ok' : 'bad'}>
            {selected === q.correct ? 'Correct!' : 'Not quite.'}
          </span>
          <button className="primary" onClick={next} autoFocus>
            {idx + 1 < ids.length ? 'Next' : 'Finish'}
          </button>
        </div>
      )}
    </section>
  )
}
