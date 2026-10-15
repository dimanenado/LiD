import { ChevronDown, Search as SearchIcon, X } from 'lucide-react'
import { ReactNode, useMemo, useState } from 'react'
import { Question, QUESTIONS, STATES, TOPIC_SHORT, questionRef } from './data'
import { QuestionCard } from './QuestionCard'
import { isMistake, Store } from './store'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type Filter = 'all' | 'general' | 'state' | 'politics' | 'history' | 'society' | 'mistakes'
const PAGE = 40

/** Wrap every match of the (normalized) term in <mark>; falls back to plain text if normalizing changed the length. */
function highlighter(term: string) {
  const t = norm(term.trim())
  return (text: string): ReactNode => {
    if (!t) return text
    const n = norm(text)
    if (n.length !== text.length) return text
    const out: ReactNode[] = []
    let from = 0
    for (let at = n.indexOf(t); at !== -1; at = n.indexOf(t, at + t.length)) {
      out.push(text.slice(from, at), <mark key={at}>{text.slice(at, at + t.length)}</mark>)
      from = at + t.length
    }
    if (!out.length) return text
    out.push(text.slice(from))
    return out
  }
}

/** Searchable catalog of the general questions plus the selected state's, with answers on tap. */
export function Search({ store }: { store: Store }) {
  const { p } = store
  const [term, setTerm] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const filters: [Filter, string][] = [
    ['all', 'All'],
    ['general', 'General'],
    ['state', STATES[p.state]],
    ['politics', TOPIC_SHORT.politics],
    ['history', TOPIC_SHORT.history],
    ['society', TOPIC_SHORT.society],
    ['mistakes', 'Mistakes'],
  ]

  const list = useMemo(() => {
    const t = norm(term.trim())
    const keep = (q: Question) => {
      switch (filter) {
        case 'general':
          return q.state === null
        case 'state':
          return q.state !== null
        case 'mistakes':
          return isMistake(p.stats[q.id])
        case 'all':
          return true
        default:
          return q.topic === filter
      }
    }
    return QUESTIONS.filter((q) => q.state === null || q.state === p.state)
      .filter(keep)
      .filter(
        (q) => !t || String(q.number) === t || norm([q.de.q, q.en.q, ...q.de.options, ...q.en.options].join(' ')).includes(t),
      )
  }, [term, filter, p.state, p.stats])

  const mark = useMemo(() => highlighter(term), [term])

  return (
    <div className="stack">
      <div className="search-bar">
        <label className="search-field">
          <SearchIcon size={18} aria-hidden className="muted" />
          <input
            id="search"
            type="search"
            placeholder="Search German or English, or a number"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setLimit(PAGE)
            }}
            aria-label="Search questions"
          />
          {term && (
            <button className="icon-btn icon-btn-sm" aria-label="Clear search" onClick={() => setTerm('')}>
              <X size={16} />
            </button>
          )}
        </label>
        <div className="chips" role="group" aria-label="Filter">
          {filters.map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'filter on' : 'filter'}
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key)
                setLimit(PAGE)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="label" aria-live="polite">
        {list.length} question{list.length === 1 ? '' : 's'}
      </p>

      {list.length === 0 ? (
        <div className="empty">
          <h2>No questions match</h2>
          <p className="muted">Try another word, or switch the filter to All.</p>
        </div>
      ) : (
        <ul className="results">
          {list.slice(0, limit).map((q) => {
            const isOpen = open === q.id
            return (
              <li key={q.id} className={isOpen ? 'result open' : 'result'}>
                <button className="result-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : q.id)}>
                  <span className="row-main">
                    <small className="muted">{questionRef(q)}</small>
                    <span className="de" lang="de">
                      {mark(q.de.q)}
                    </span>
                    {p.showEnglish && (
                      <span className="en" lang="en">
                        {mark(q.en.q)}
                      </span>
                    )}
                  </span>
                  <ChevronDown size={18} aria-hidden className={isOpen ? 'muted flip' : 'muted'} />
                </button>
                {isOpen && (
                  <div className="result-body">
                    <QuestionCard q={q} showEnglish={p.showEnglish} selected={null} reveal hideQuestion mark={mark} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {list.length > limit && (
        <button className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({list.length - limit} left)
        </button>
      )}
    </div>
  )
}
