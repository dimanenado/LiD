import { ArrowRight, BookOpen, Landmark, RotateCcw, Scale, Shuffle, Sparkles, Users } from 'lucide-react'
import { GENERAL, QUESTIONS, STATES, TOPIC_SHORT, stateQuestions } from './data'
import { isMastered, isMistake, Store } from './store'
import { Meter } from './ui'

const TOPIC_ICON = { politics: Scale, history: Landmark, society: Users }

interface Props {
  store: Store
  practise: (title: string, qs: typeof QUESTIONS, forceShuffle?: boolean) => void
}

export function Learn({ store, practise }: Props) {
  const { p } = store
  const pool = [...GENERAL, ...stateQuestions(p.state)]
  const mastered = pool.filter((q) => isMastered(p.stats[q.id])).length
  const mistakes = pool.filter((q) => isMistake(p.stats[q.id]))
  const unseen = pool.filter((q) => !p.stats[q.id])

  // one recommended next step: mistakes first, then new questions, then everything shuffled
  const next = mistakes.length
    ? { label: `Review ${mistakes.length} mistake${mistakes.length === 1 ? '' : 's'}`, go: () => practise('Review mistakes', mistakes, true) }
    : unseen.length
      ? { label: `Start ${Math.min(unseen.length, 20)} new questions`, go: () => practise('New questions', unseen.slice(0, 20), true) }
      : { label: 'Practise everything, shuffled', go: () => practise('All questions', pool, true) }

  const tiles = [
    ...(['politics', 'history', 'society'] as const).map((t) => ({
      key: t,
      title: TOPIC_SHORT[t],
      Icon: TOPIC_ICON[t],
      qs: GENERAL.filter((q) => q.topic === t),
    })),
    { key: 'state', title: STATES[p.state], Icon: BookOpen, qs: stateQuestions(p.state) },
  ]

  return (
    <div className="stack">
      <section className="hero">
        <span className="hero-label">Mastered</span>
        <div className="hero-num">
          {mastered} <small>/ {pool.length}</small>
        </div>
        <div className="hero-meter" aria-label={`${mastered} of ${pool.length} mastered`}>
          <i style={{ width: `${(mastered / pool.length) * 100}%` }} />
        </div>
        <div className="hero-stats">
          <span>{pool.length - unseen.length} seen</span>
          <span>{mistakes.length} to review</span>
          <span>{p.exams[0] ? `Last exam ${p.exams[0].score}/${p.exams[0].total}` : 'No exam yet'}</span>
        </div>
        <button className="btn btn-on-accent" onClick={next.go}>
          {next.label} <ArrowRight size={18} aria-hidden />
        </button>
      </section>

      <section className="stack-sm">
        <h2 className="label">Practise by topic</h2>
        <div className="tiles">
          {tiles.map(({ key, title, Icon, qs }) => {
            const m = qs.filter((q) => isMastered(p.stats[q.id])).length
            return (
              <button key={key} className="tile" onClick={() => practise(title, qs)}>
                <span className="tile-head">
                  <Icon size={18} aria-hidden className="tile-icon" />
                  <b>{title}</b>
                </span>
                <Meter value={m / qs.length} label={`${m} of ${qs.length} mastered`} />
                <small>
                  {m} / {qs.length} mastered
                </small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="stack-sm">
        <h2 className="label">Quick start</h2>
        <div className="list">
          <button className="list-row" disabled={!unseen.length} onClick={() => practise('New questions', unseen)}>
            <Sparkles size={18} aria-hidden className="list-icon" />
            <span className="row-main">
              <b>New questions</b>
              <small>{unseen.length ? `${unseen.length} not seen yet` : 'You have seen every question'}</small>
            </span>
            <ArrowRight size={18} aria-hidden className="muted" />
          </button>
          <button className="list-row" disabled={!mistakes.length} onClick={() => practise('Review mistakes', mistakes, true)}>
            <RotateCcw size={18} aria-hidden className="list-icon" />
            <span className="row-main">
              <b>Mistakes</b>
              <small>{mistakes.length ? `${mistakes.length} to review` : 'No mistakes to review'}</small>
            </span>
            <ArrowRight size={18} aria-hidden className="muted" />
          </button>
          <button className="list-row" onClick={() => practise('All 300 general questions', GENERAL)}>
            <Shuffle size={18} aria-hidden className="list-icon" />
            <span className="row-main">
              <b>All general questions</b>
              <small>300 questions{p.shuffle ? ', shuffled' : ', in catalog order'}</small>
            </span>
            <ArrowRight size={18} aria-hidden className="muted" />
          </button>
        </div>
      </section>
    </div>
  )
}
