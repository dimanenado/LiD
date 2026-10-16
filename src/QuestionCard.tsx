import { Check, Flag, Info, Shuffle, X } from 'lucide-react'
import { ReactNode } from 'react'
import { Question, imageUrl, questionRef } from './data'
import { feedbackUrl } from './feedback'
import { LANGS, Translation, useTranslation } from './i18n'
import { highlight, keywordsFor, lookAlikes } from './keywords'

interface Props {
  q: Question
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

export function QuestionCard({ q, selected, reveal, onSelect, label, hideQuestion, mark, keywords, userState }: Props) {
  const t = useTranslation()
  const tr = t.show ? t.text(q) : undefined
  const bi = tr ? 'bi' : 'mono'
  const kw = keywords && !mark ? keywordsFor(q) : undefined
  const plain = mark ?? ((s: string) => s)
  // key words exist for German and English only
  const qText = (lang: 'de' | 'en') => (kw ? highlight(q[lang].q, kw.q[lang], lang, true) : plain(q[lang].q))
  const oText = (lang: 'de' | 'en', i: number) =>
    kw && reveal && i === q.correct ? highlight(q[lang].options[i], kw.a[lang], lang, false) : plain(q[lang].options[i])
  const trQ = () => (t.lang === 'en' ? qText('en') : plain(tr!.q))
  const trOption = (i: number) => (t.lang === 'en' ? oText('en', i) : plain(tr!.options[i]))
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
            {tr && (
              <p className="en" lang={t.lang}>
                <span className="lang-tag" aria-hidden>
                  {LANGS[t.lang].code}
                </span>
                <span>{trQ()}</span>
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
                {tr && (
                  <span className="en" lang={t.lang}>
                    {' '}
                    · {LANGS[t.lang].image} {i + 1}
                  </span>
                )}
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
          const other = tr?.options[i]
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
                  {other && other !== de && (
                    <span lang={t.lang} className="en">
                      {trOption(i)}
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

      {alikes.length > 0 && <LookAlikes q={q} others={alikes} t={t} />}

      <a className="report-link" href={feedbackUrl({ question: q, state: userState })} target="_blank" rel="noopener">
        <Flag size={13} aria-hidden /> Report a problem with this question
      </a>
    </article>
  )
}

const answerOf = (options: string[] | undefined, q: Question) => options?.[q.correct].replace(/[.…]+$/, '')

/** Questions that sound like this one but have another answer, each with its own answer, to keep them apart. */
function LookAlikes({ q, others, t }: { q: Question; others: Question[]; t: Translation }) {
  return (
    <aside className="alikes" aria-label="Look-alike questions">
      <h3 className="alikes-head chip chip-warn">
        <Shuffle size={14} aria-hidden /> Don&apos;t mix up
      </h3>
      <ul>
        {others.map((o) => {
          const twin = o.de.q === q.de.q
          const kw = keywordsFor(o)!
          const de = answerOf(o.de.options, o)
          const other = t.show ? answerOf(t.text(o)?.options, o) : undefined
          return (
            <li key={o.id}>
              <small className="muted">
                {questionRef(o)}
                {twin && ' · same question, other options'}
              </small>
              {!twin && (
                <span lang="de">
                  {highlight(o.de.q, kw.q.de, 'de', true)}
                </span>
              )}
              <span>
                <span aria-hidden>→ </span>
                <b lang="de">{de}</b>
                {other && other !== de && (
                  <span lang={t.lang} className="en">
                    {' '}
                    · {other}
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
