import { Check, Info, X } from 'lucide-react'
import { ReactNode } from 'react'
import { Question, imageUrl, questionRef } from './data'

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
}

const LETTERS = ['A', 'B', 'C', 'D']

export function QuestionCard({ q, showEnglish, selected, reveal, onSelect, label, hideQuestion, mark = (t) => t }: Props) {
  const bi = showEnglish ? 'bi' : 'mono'
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
              {mark(q.de.q)}
            </p>
            {showEnglish && (
              <p className="en" lang="en">
                <span className="lang-tag" aria-hidden>
                  EN
                </span>
                <span>{mark(q.en.q)}</span>
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
                  <span lang="de">{mark(de)}</span>
                  {showEnglish && en !== de && (
                    <span lang="en" className="en">
                      {mark(en)}
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
    </article>
  )
}
