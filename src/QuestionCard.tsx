import { Question, STATES, imageUrl } from './data'

interface Props {
  q: Question
  showEnglish: boolean
  selected: number | null
  /** show right/wrong colouring */
  reveal: boolean
  onSelect?: (i: number) => void
}

const LETTERS = ['A', 'B', 'C', 'D']

export function QuestionCard({ q, showEnglish, selected, reveal, onSelect }: Props) {
  const cols = showEnglish ? 'bi' : 'mono'
  return (
    <article className="card">
      <div className="qmeta">
        <span>{q.state ? `${STATES[q.state]} · ${q.number}` : `Question ${q.number}`}</span>
        {q.answerStatus === 'draft' && (
          <span className="badge" title="This answer has not yet been checked against the official BAMF tool">
            unverified answer
          </span>
        )}
      </div>

      <div className={`row ${cols} qtext`}>
        <p lang="de">{q.de.q}</p>
        {showEnglish && <p lang="en" className="en">{q.en.q}</p>}
      </div>

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
              <img src={imageUrl(f)} alt={`Image ${i + 1}`} loading="lazy" />
              <figcaption>Bild {i + 1}</figcaption>
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
          return (
            <li key={i}>
              <button
                className={`option row ${cols} ${state}`}
                onClick={() => onSelect?.(i)}
                disabled={!onSelect}
                aria-pressed={i === selected}
              >
                <span className="letter">{LETTERS[i]}</span>
                <span lang="de">{de}</span>
                {showEnglish && q.en.options[i] !== de && (
                  <span lang="en" className="en">
                    {q.en.options[i]}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
