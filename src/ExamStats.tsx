import { ChevronLeft, ChevronRight, Clock, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BY_ID, PASS, STATES, TOPIC_SHORT, questionRef } from './data'
import { QuestionCard } from './QuestionCard'
import { ExamResult, Store } from './store'
import { LangToggle } from './ui'

const CHART_MAX = 20

const passed = (e: ExamResult) => e.score >= PASS
const minutes = (s: number) => Math.max(1, Math.round(s / 60))
const fmtDate = (d: number) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** Score bars, oldest left, with the pass line. */
function ScoreChart({ exams, compact = false }: { exams: ExamResult[]; compact?: boolean }) {
  const shown = exams.slice(0, compact ? 10 : CHART_MAX).reverse()
  const total = shown[0]?.total ?? 33
  return (
    <div className={compact ? 'score-chart compact' : 'score-chart'}>
      {!compact && (
        <div className="chart-axis" aria-hidden>
          <span>{total}</span>
          <span style={{ bottom: `${(PASS / total) * 100}%` }}>{PASS}</span>
          <span>0</span>
        </div>
      )}
      <div className="chart-plot" role="img" aria-label={`Scores of your last ${shown.length} exams: ${shown.map((e) => e.score).join(', ')}`}>
        <i className="pass-line" style={{ bottom: `${(PASS / total) * 100}%` }} />
        {shown.map((e) => (
          <span key={e.date} className="chart-col" title={`${e.score} / ${e.total}, ${fmtDate(e.date)}`}>
            <i className={passed(e) ? 'ok' : 'bad'} style={{ height: `${Math.max(3, (e.score / e.total) * 100)}%` }} />
          </span>
        ))}
      </div>
    </div>
  )
}

/** Card on the exam start screen; opens the stats screen. */
export function ExamSummaryCard({ exams, onOpen }: { exams: ExamResult[]; onOpen: () => void }) {
  const last = exams[0]
  const pass = exams.filter(passed).length
  return (
    <button className="exam-summary" onClick={onOpen}>
      <span className="exam-summary-head">
        <span className="label">Your exams</span>
        <span className="link">
          Stats <ChevronRight size={16} aria-hidden />
        </span>
      </span>
      <span className="exam-summary-body">
        <span className="exam-summary-nums">
          <span className="big-num tnum">
            {last.score}
            <small> / {last.total}</small>
          </span>
          <span className={`chip ${passed(last) ? 'chip-ok' : 'chip-bad'}`}>{passed(last) ? 'Passed' : 'Not passed'}</span>
          <small className="muted">
            Last exam, {fmtDate(last.date)} · passed {pass} of {exams.length}
          </small>
        </span>
        <ScoreChart exams={exams} compact />
      </span>
    </button>
  )
}

interface StatsProps {
  store: Store
  onBack: () => void
  onPractise: (title: string, ids: string[]) => void
}

/** Exam statistics: totals, score chart, topic accuracy, most missed questions, and every attempt. */
export function ExamStats({ store, onBack, onPractise }: StatsProps) {
  const exams = store.p.exams
  const [reviewing, setReviewing] = useState<ExamResult | null>(null)

  useEffect(() => window.scrollTo({ top: 0 }), [reviewing])

  if (reviewing) return <ExamReview exam={reviewing} store={store} onBack={() => setReviewing(null)} />

  const n = exams.length
  const pass = exams.filter(passed).length
  const best = Math.max(...exams.map((e) => e.score))
  const avg = exams.reduce((a, e) => a + e.score, 0) / n
  const avgMin = minutes(exams.reduce((a, e) => a + e.seconds, 0) / n)

  // per-question detail exists only for exams saved with answers
  const detailed = exams.filter((e) => e.answers)
  const topics = new Map<string, { ok: number; all: number }>()
  const missed = new Map<string, number>()
  for (const e of detailed)
    for (const [id, chosen] of e.answers!) {
      const q = BY_ID.get(id)
      if (!q) continue
      const key = q.state ? 'state' : q.topic
      const t = topics.get(key) ?? { ok: 0, all: 0 }
      t.all++
      if (chosen === q.correct) t.ok++
      else missed.set(id, (missed.get(id) ?? 0) + 1)
      topics.set(key, t)
    }
  const topicRows = (['politics', 'history', 'society', 'state'] as const)
    .filter((k) => topics.has(k))
    .map((k) => ({ label: k === 'state' ? 'State questions' : TOPIC_SHORT[k], ...topics.get(k)! }))
  const mostMissed = [...missed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div className="session">
      <header className="sessbar">
        <div className="sessbar-in">
          <button className="icon-btn" aria-label="Back to exam" onClick={onBack}>
            <ChevronLeft size={18} />
          </button>
          <strong className="sess-title">Exam stats</strong>
        </div>
      </header>
      <main className="page">
        <div className="stack">
          <section className="stat-tiles">
            <div className="stat">
              <span className="stat-num tnum">{n}</span>
              <span className="stat-label">Attempts</span>
            </div>
            <div className="stat">
              <span className="stat-num tnum">{Math.round((pass / n) * 100)}%</span>
              <span className="stat-label">Passed ({pass})</span>
            </div>
            <div className="stat">
              <span className="stat-num tnum">{best}</span>
              <span className="stat-label">Best score</span>
            </div>
            <div className="stat">
              <span className="stat-num tnum">{avg.toFixed(1)}</span>
              <span className="stat-label">Average</span>
            </div>
            <div className="stat">
              <span className="stat-num tnum">{avgMin}</span>
              <span className="stat-label">Avg minutes</span>
            </div>
          </section>

          <section className="stack-sm">
            <h2 className="label">Scores{n > CHART_MAX ? ` · last ${CHART_MAX}` : ''}</h2>
            <div className="panel">
              <ScoreChart exams={exams} />
              <div className="chart-legend">
                <span>Oldest</span>
                <span>
                  <i className="legend-line" /> {PASS} to pass
                </span>
                <span>Latest</span>
              </div>
            </div>
          </section>

          <section className="stack-sm">
            <h2 className="label">By topic in exams</h2>
            {topicRows.length ? (
              <div className="panel">
                {topicRows.map((t) => {
                  const pct = Math.round((t.ok / t.all) * 100)
                  return (
                    <div key={t.label} className="mastery">
                      <div className="mastery-head">
                        <b>{t.label}</b>
                        <span className="muted tnum">
                          {pct}% · {t.ok} / {t.all}
                        </span>
                      </div>
                      <div className="meter">
                        <i className={pct < 50 ? 'low' : ''} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="panel muted small">Topic results start with your next exam.</div>
            )}
          </section>

          {mostMissed.length > 0 && (
            <section className="stack-sm">
              <div className="section-head">
                <h2 className="label">Missed most often</h2>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onPractise('Missed most in exams', mostMissed.map(([id]) => id))}
                >
                  <RotateCcw size={14} aria-hidden /> Practise these
                </button>
              </div>
              <ul className="rows">
                {mostMissed.map(([id, count]) => {
                  const q = BY_ID.get(id)!
                  return (
                    <li key={id} className="row-static">
                      <span className="row-main">
                        <span className="clamp-2" lang="de">
                          {q.de.q}
                        </span>
                        {store.p.showEnglish && (
                          <span className="en clamp-2" lang="en">
                            {q.en.q}
                          </span>
                        )}
                      </span>
                      <span className="chip chip-bad">{count}×</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="stack-sm">
            <h2 className="label">All attempts</h2>
            <ul className="list">
              {exams.map((e) => {
                const inner = (
                  <>
                    <span className={`chip ${passed(e) ? 'chip-ok' : 'chip-bad'}`}>{passed(e) ? 'Passed' : 'Not passed'}</span>
                    <span className="row-main">
                      <b className="tnum">
                        {e.score} / {e.total}
                      </b>
                      <small>
                        {new Date(e.date).toLocaleDateString()} · {STATES[e.state]} · {minutes(e.seconds)} min
                        {!e.answers && ' · answers not saved'}
                      </small>
                    </span>
                    {e.score === best && <Trophy size={16} aria-label="Best score" className="trophy" />}
                    {e.answers && <ChevronRight size={18} aria-hidden className="muted" />}
                  </>
                )
                return (
                  <li key={e.date}>
                    {e.answers ? (
                      <button className="list-row" onClick={() => setReviewing(e)}>
                        {inner}
                      </button>
                    ) : (
                      <div className="list-row static">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}

/** Read-only walk through one past exam with the answers given. */
function ExamReview({ exam, store, onBack }: { exam: ExamResult; store: Store; onBack: () => void }) {
  const answers = exam.answers!.filter(([id]) => BY_ID.has(id))
  const [idx, setIdx] = useState(0)
  const [id, chosen] = answers[idx]
  const q = BY_ID.get(id)!
  const go = (i: number) => {
    setIdx(i)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="session">
      <header className="sessbar">
        <div className="sessbar-in">
          <button className="icon-btn" aria-label="Back to exam stats" onClick={onBack}>
            <ChevronLeft size={18} />
          </button>
          <strong className="sess-title">
            {fmtDate(exam.date)} · {exam.score} / {exam.total}
          </strong>
          <LangToggle showEnglish={store.p.showEnglish} onChange={(v) => store.update({ showEnglish: v })} />
          <span className="chip">
            <Clock size={14} aria-hidden /> {minutes(exam.seconds)} min
          </span>
        </div>
      </header>
      <div className="sess-progress">
        <nav className="qgrid" aria-label="Questions">
          {answers.map(([qid, c], i) => {
            const ok = c === BY_ID.get(qid)!.correct
            return (
              <button
                key={qid}
                className={`${ok ? 'correct' : 'wrong'} ${i === idx ? 'current' : ''}`}
                aria-current={i === idx ? 'step' : undefined}
                aria-label={`Question ${i + 1}, ${ok ? 'correct' : 'wrong'}`}
                onClick={() => go(i)}
              >
                {i + 1}
              </button>
            )
          })}
        </nav>
      </div>
      <main className="page page-wide">
        <QuestionCard
          q={q}
          label={`Question ${idx + 1}`}
          showEnglish={store.p.showEnglish}
          selected={chosen}
          reveal
        />
        {chosen === null && <p className="muted center">You did not answer this question.</p>}
      </main>
      <footer className="dock">
        <div className="dock-in">
          <button className="btn btn-secondary btn-icon" aria-label="Previous question" disabled={idx === 0} onClick={() => go(idx - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="grow muted small center">{questionRef(q)}</span>
          <button
            className="btn btn-secondary btn-icon"
            aria-label="Next question"
            disabled={idx + 1 === answers.length}
            onClick={() => go(idx + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  )
}
