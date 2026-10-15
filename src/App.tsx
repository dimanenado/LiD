import { useRef, useState } from 'react'
import { Browse } from './Browse'
import { GENERAL, QUESTIONS, STATES, TOPIC_LABELS, Topic, shuffle, stateQuestions } from './data'
import { Exam } from './Exam'
import { Practice } from './Practice'
import { isMastered, isMistake, useProgress } from './store'

type View =
  | { kind: 'home' }
  | { kind: 'practice'; title: string; ids: string[] }
  | { kind: 'exam' }
  | { kind: 'browse' }

export default function App() {
  const store = useProgress()
  const { p, update } = store
  const [view, setView] = useState<View>({ kind: 'home' })
  const [shuffled, setShuffled] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const pool = [...GENERAL, ...stateQuestions(p.state)]
  const mastered = pool.filter((q) => isMastered(p.stats[q.id])).length
  const mistakes = QUESTIONS.filter((q) => isMistake(p.stats[q.id]) && (q.state === null || q.state === p.state))
  const unseen = pool.filter((q) => !p.stats[q.id])

  const home = () => setView({ kind: 'home' })
  const practise = (title: string, qs: typeof QUESTIONS, forceShuffle = false) =>
    setView({ kind: 'practice', title, ids: (shuffled || forceShuffle ? shuffle(qs) : qs).map((q) => q.id) })

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(p, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `lid-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importProgress = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (typeof data !== 'object' || !data.stats) throw new Error('bad file')
      update({ state: data.state ?? p.state, showEnglish: data.showEnglish ?? true, stats: data.stats, exams: data.exams ?? [] })
      alert('Progress imported.')
    } catch {
      alert('That file does not look like an exported progress file.')
    }
  }

  let body
  if (view.kind === 'practice')
    body = <Practice key={view.ids.join()} title={view.title} ids={view.ids} store={store} onExit={home} />
  else if (view.kind === 'exam') body = <Exam store={store} onExit={home} />
  else if (view.kind === 'browse') body = <Browse store={store} onExit={home} />
  else
    body = (
      <>
        <section className="panel settings">
          <label>
            Your federal state
            <select value={p.state} onChange={(e) => update({ state: e.target.value })}>
              {Object.entries(STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={p.showEnglish} onChange={(e) => update({ showEnglish: e.target.checked })} />
            Show English translation
          </label>
          <label className="check">
            <input type="checkbox" checked={shuffled} onChange={(e) => setShuffled(e.target.checked)} />
            Shuffle practice questions
          </label>
        </section>

        <section className="panel stats">
          <div>
            <strong>{mastered}</strong>
            <span>of {pool.length} mastered</span>
          </div>
          <div>
            <strong>{pool.length - unseen.length}</strong>
            <span>seen</span>
          </div>
          <div>
            <strong>{mistakes.length}</strong>
            <span>to review</span>
          </div>
          <div>
            <strong>{p.exams[0] ? `${p.exams[0].score}/${p.exams[0].total}` : '–'}</strong>
            <span>last exam</span>
          </div>
          <div className="bar">
            <div style={{ width: `${(mastered / pool.length) * 100}%` }} />
          </div>
        </section>

        <h2>Practise</h2>
        <div className="modes">
          <button className="mode primary" onClick={() => setView({ kind: 'exam' })}>
            <strong>Mock exam</strong>
            <span>33 questions, 60 minutes, 17 to pass</span>
          </button>
          <button className="mode" disabled={!mistakes.length} onClick={() => practise('Review mistakes', mistakes, true)}>
            <strong>Review mistakes</strong>
            <span>{mistakes.length ? `${mistakes.length} questions` : 'No mistakes yet'}</span>
          </button>
          <button className="mode" disabled={!unseen.length} onClick={() => practise('New questions', unseen)}>
            <strong>New questions</strong>
            <span>{unseen.length} not seen yet</span>
          </button>
          <button className="mode" onClick={() => practise(STATES[p.state], stateQuestions(p.state))}>
            <strong>{STATES[p.state]}</strong>
            <span>10 state questions</span>
          </button>
          {(['politics', 'history', 'society'] as Topic[]).map((t) => {
            const qs = GENERAL.filter((q) => q.topic === t)
            return (
              <button key={t} className="mode" onClick={() => practise(TOPIC_LABELS[t], qs)}>
                <strong>{TOPIC_LABELS[t]}</strong>
                <span>
                  {qs.filter((q) => isMastered(p.stats[q.id])).length} / {qs.length} mastered
                </span>
              </button>
            )
          })}
          <button className="mode" onClick={() => practise('All 300 general questions', GENERAL)}>
            <strong>All general questions</strong>
            <span>300 questions</span>
          </button>
          <button className="mode" onClick={() => setView({ kind: 'browse' })}>
            <strong>Browse and search</strong>
            <span>All questions with answers</span>
          </button>
        </div>

        {p.exams.length > 0 && (
          <>
            <h2>Exam history</h2>
            <ul className="history">
              {p.exams.slice(0, 10).map((e) => (
                <li key={e.date} className={e.score >= 17 ? 'ok' : 'bad'}>
                  {new Date(e.date).toLocaleString()} · {STATES[e.state]} · {e.score}/{e.total} ·{' '}
                  {Math.round(e.seconds / 60)} min
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Your progress</h2>
        <p className="muted">
          Progress is saved in this browser only. Export it to move it to another device.
        </p>
        <div className="actions">
          <button onClick={exportProgress}>Export progress</button>
          <button onClick={() => fileRef.current?.click()}>Import progress</button>
          <button
            onClick={() => confirm('Delete all your progress and exam history?') && update({ stats: {}, exams: [] })}
          >
            Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])}
          />
        </div>
        <p className="muted small">
          Questions from the official BAMF catalog “Gesamtfragenkatalog zum Test Leben in Deutschland” (as of 07.05.2025).
          English translations are unofficial. Answers were checked against the official BAMF online tool on 15.10.2026.
        </p>
      </>
    )

  return (
    <div className="app">
      <header className="top">
        <h1 onClick={home}>Leben in Deutschland</h1>
        <span className="muted">Test prep · DE / EN</span>
      </header>
      <main>{body}</main>
    </div>
  )
}
