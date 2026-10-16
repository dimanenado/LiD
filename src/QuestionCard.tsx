import { Check, Info, Shuffle, X } from 'lucide-react'
import { ReactNode } from 'react'
import { Question, imageUrl, questionRef } from './data'
import { highlight, keywordsFor, lookAlikes } from './keywords'

interface Props {
  q: Question
  showEnglish: boolean
  selected: number | null
  /** show right/wrong colouring */
  reveal: boolean
  onSelect?: (i: number) => void
  /** label shown top left, e.g. "Question 5 of 10" */
  label?: string
  /** leave out the question text (search rows already show it) */
  hideQuestion?: boolean
  /** wrap matches in <mark> (search) */
  mark?: (text: string) => ReactNode
  /** highlight key words; answer words and look-alikes only show once the answer is revealed */
  keywords?: boolean
  /** the user's federal state, so look-alikes from other states are left out */
  userState?: string
}

const LETTERS = ['A', 'B', 'C', 'D']

export function QuestionCard({ q, showEnglish, selected, reveal, onSelect, label, hideQuestion, mark, keywords, userState }: Props) {
  const bi = showEnglish ? 'bi' : 'mono'
  const kw = keywords && !mark ? keywordsFor(q) : undefined
  const plain = mark ?? ((t: string) => t)
  const qText = (lang: 'de' | 'en') => (kw ? highlight(q[lang].q, kw.q[lang], lang, true) : plain(q[lang].q))
  const oText = (lang: 'de' | 'en', i: number) =>
    kw && reveal && i === q.correct ? highlight(q[lang].options[i], kw.a[lang], lang, false) : plain(q[lang].options[i])
  const alikes = kw && reveal ? lookAlikes(q, userState ?? '') : []
  return (
    <article className="qcard">
      {!hideQuestion && (
        <>
          <div className="qmeta">
            <span>{label ? `${label} · ${questionRef(q)}` : questionRef(q)}</span>
            {q.answerStatus === 'draft' && (
              <span className="chip chip-warn" title="This answer has not yet been checked against the official BAMF tool">
                <Info size={13} aria-hidden /> Unverified answer
              </span>
            )}
          </div>
          <div className={`qtext ${bi}`}>
            <p className="de" lang="de">
              {qText('de')}
            </p>
            {showEnglish && (
              <p className="en" lang="en">
                <span className="lang-tag" aria-hidden>
                  EN
                </span>
                <span>{qText('en')}</span>
              </p>
            )}
          </div>
        </>
      )}

      {q.image && (
        <figure className="qimage">
          <img src={imageUrl(q.image)} alt="Image for this question" loading="lazy" />
          {q.credit && <figcaption>{q.credit}</figcaption>}
        </figure>
      )}

      {q.optionImages && (
        <div className="optimages">
          {q.optionImages.map((f, i) => (
            <figure key={f}>
              <img src={imageUrl(f)} alt={`Bild ${i + 1}`} loading="lazy" />
              <figcaption>
                Bild {i + 1}
                {showEnglish && <span className="en"> · Image {i + 1}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <ol className="options">
        {q.de.options.map((de, i) => {
          let state = ''
          if (reveal && i === q.correct) state = 'correct'
          else if (reveal && i === selected) state = 'wrong'
          else if (i === selected) state = 'selected'
          const en = q.en.options[i]
          return (
            <li key={i}>
              <button
                className={`option ${state}`}
                onClick={() => onSelect?.(i)}
                disabled={!onSelect}
                aria-pressed={onSelect ? i === selected : undefined}
                aria-keyshortcuts={onSelect ? String(i + 1) : undefined}
              >
                <span className="letter" aria-hidden>
                  {LETTERS[i]}
                </span>
                <span className={`otext ${bi}`}>
                  <span lang="de">{oText('de', i)}</span>
                  {showEnglish && en !== de && (
                    <span lang="en" className="en">
                      {oText('en', i)}
                    </span>
                  )}
                </span>
                <span className="mark-icon" aria-hidden>
                  {state === 'correct' && <Check size={18} strokeWidth={2.5} />}
                  {state === 'wrong' && <X size={18} strokeWidth={2.5} />}
                </span>
                {state === 'correct' && <span className="sr-only">(correct answer)</span>}
                {state === 'wrong' && <span className="sr-only">(your answer, wrong)</span>}
              </button>
            </li>
          )
        })}
      </ol>

      {alikes.length > 0 && <LookAlikes q={q} others={alikes} showEnglish={showEnglish} />}
    </article>
  )
}

const answerOf = (q: Question, lang: 'de' | 'en') => q[lang].options[q.correct].replace(/[.…]+$/, '')

/** Questions that sound like this one but have another answer, each with its own answer, to keep them apart. */
function LookAlikes({ q, others, showEnglish }: { q: Question; others: Question[]; showEnglish: boolean }) {
  return (
    <aside className="alikes" aria-label="Look-alike questions">
      <h3 className="alikes-head">
        <Shuffle size={15} aria-hidden /> Don&apos;t mix up
      </h3>
      <ul>
        {others.map((o) => {
          const twin = o.de.q === q.de.q
          const kw = keywordsFor(o)!
          return (
            <li key={o.id}>
              <small className="muted">
                {questionRef(o)}
                {twin && ' · same question, other options'}
              </small>
              {!twin && (
                <span lang="de" className="alike-q">
                  {highlight(o.de.q, kw.q.de, 'de', true)}
                </span>
              )}
              <span className="alike-a">
                <span aria-hidden>→ </span>
                <b lang="de">{answerOf(o, 'de')}</b>
                {showEnglish && answerOf(o, 'en') !== answerOf(o, 'de') && (
                  <span lang="en" className="en">
                    {' '}
                    · {answerOf(o, 'en')}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
