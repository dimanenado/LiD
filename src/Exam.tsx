import { useEffect, useMemo, useState } from 'react'
import { BY_ID, GENERAL, STATES, shuffle, stateQuestions } from './data'
import { QuestionCard } from './QuestionCard'
import { Store } from './store'

const LIMIT = 60 * 60
const PASS = 17

/** Mock test: 30 general + 3 state questions, 60 minutes, results at the end. */
export function Exam({ store, onExit }: { store: Store; onExit: () => void }) {
  const ids = useMemo(
    () => [
      ...shuffle(GENERAL).slice(0, 30).map((q) => q.id),
      ...shuffle(stateQuestions(store.p.state)).slice(0, 3).map((q) => q.id),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [answers, setAnswers] = useState<(number | null)[]>(() => ids.map(() => null))
  const [idx, setIdx] = useState(0)
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [finished, setFinished] = useState<number | null>(null)

  const elapsed = Math.floor(((finished ?? now) - start) / 1000)
  const left = Math.max(0, LIMIT - elapsed)

  useEffect(() => {
    if (finished) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [finished])

  const submit = () => {
    if (finished) return
    const end = Date.now()
    let score = 0
    ids.forEach((id, i) => {
      const q = BY_ID.get(id)!
      const ok = answers[i] === q.correct
      if (ok) score++
      if (answers[i] !== null) store.record(id, ok)
    })
    store.addExam({ date: end, state: store.p.state, score, total: ids.length, seconds: Math.floor((end - start) / 1000) })
    setFinished(end)
    setIdx(0)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (left === 0 && !finished) submit()
  })

  const score = ids.filter((id, i) => answers[i] === BY_ID.get(id)!.correct).length
  const unanswered = answers.filter((a) => a === null).length
  const q = BY_ID.get(ids[idx])!
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <section>
      <header className="sessionbar">
        <button onClick={() => (finished || confirm('Leave the exam? Your answers will be lost.')) && onExit()}>✕</button>
        <strong>Mock exam · {STATES[store.p.state]}</strong>
        {finished ? <span>Review</span> : <span className={left < 300 ? 'bad' : ''}>⏱ {mm}:{ss}</span>}
      </header>

      {finished && (
        <div className={`result ${score >= PASS ? 'pass' : 'fail'}`}>
          <h2>{score >= PASS ? 'Passed' : 'Not passed'}: {score} / {ids.length}</h2>
          <p>
            You need {PASS} correct answers to pass. Tap any number below to review that question.
          </p>
          <button className="primary" onClick={onExit}>
            Back to home
          </button>
        </div>
      )}

      <nav className="grid33" aria-label="Questions">
        {ids.map((id, i) => {
          let cls = answers[i] !== null ? 'answered' : ''
          if (finished) cls = answers[i] === BY_ID.get(id)!.correct ? 'correct' : 'wrong'
          return (
            <button key={id} className={`${cls} ${i === idx ? 'current' : ''}`} onClick={() => setIdx(i)}>
              {i + 1}
            </button>
          )
        })}
      </nav>

      <QuestionCard
        q={q}
        showEnglish={store.p.showEnglish}
        selected={answers[idx]}
        reveal={!!finished}
        onSelect={
          finished
            ? undefined
            : (i) => {
                setAnswers((a) => a.map((v, k) => (k === idx ? i : v)))
              }
        }
      />

      <div className="feedback">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          Previous
        </button>
        {idx + 1 < ids.length && <button onClick={() => setIdx(idx + 1)}>Next</button>}
        {!finished && (
          <button
            className="primary"
            onClick={() => (unanswered === 0 || confirm(`${unanswered} questions unanswered. Submit anyway?`)) && submit()}
          >
            Submit exam
          </button>
        )}
      </div>
    </section>
  )
}
