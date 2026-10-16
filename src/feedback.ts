import { Question } from './data'

const FORM = 'https://tally.so/r/e5Z7vJ'

/** Link to the feedback form; the hidden fields tell us where the user came from. */
export function feedbackUrl(o: { question?: Question; state?: string } = {}) {
  const p = new URLSearchParams({
    page: location.hash.slice(1) || 'learn',
    version: __APP_VERSION__,
  })
  if (o.question) p.set('question', o.question.id)
  if (o.state) p.set('state', o.state)
  return `${FORM}?${p}`
}
