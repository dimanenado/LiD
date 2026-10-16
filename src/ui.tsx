import { ReactNode, useEffect, useRef } from 'react'
import { Check, MapPin, X } from 'lucide-react'
import { Question, STATES } from './data'
import { LANGS, useTranslation } from './i18n'
import type { Store } from './store'

/** Horizontal progress bar; value 0..1. */
export function Meter({ value, tone = 'ok', label }: { value: number; tone?: 'ok' | 'accent'; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className={`meter meter-${tone}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Switch({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="setting" htmlFor={id}>
      <span className="setting-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input id={id} className="switch" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

/** "DE" / "DE + EN" toggle used in every session header; names the language picked in settings. */
export function LangToggle({ store }: { store: Store }) {
  const { showTranslation: on, lang } = store.p
  const set = (v: boolean) => store.update({ showTranslation: v })
  return (
    <div className="seg" role="group" aria-label="Languages shown">
      <button className={!on ? 'on' : ''} aria-pressed={!on} onClick={() => set(false)}>
        DE
      </button>
      <button className={on ? 'on' : ''} aria-pressed={on} onClick={() => set(true)} aria-label={`German and ${LANGS[lang].name}`}>
        DE + {LANGS[lang].code}
      </button>
    </div>
  )
}

/** The question in the translation language, for list rows; nothing while translations are off. */
export function TransQuestion({ q, className }: { q: Question; className?: string }) {
  const t = useTranslation()
  const text = t.show ? t.text(q) : undefined
  return text ? (
    <span className={className} lang={t.lang}>
      {text.q}
    </span>
  ) : null
}

/** Modal shell used for confirms and the state picker. Closes on Escape and on the scrim. */
export function Modal({ title, onClose, children, sheet = false }: { title: string; onClose: () => void; children: ReactNode; sheet?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('noscroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('noscroll')
      prev?.focus?.()
    }
  }, [])
  return (
    <div className="scrim" onClick={onClose}>
      <div
        ref={ref}
        className={sheet ? 'modal sheet' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function StatePicker({ value, onPick, onClose, title = 'Your federal state' }: { value: string; onPick: (code: string) => void; onClose: () => void; title?: string }) {
  return (
    <Modal title={title} onClose={onClose} sheet>
      <p className="modal-body muted">The test includes 3 questions about the state you take it in.</p>
      <ul className="state-list">
        {Object.entries(STATES).map(([code, name]) => (
          <li key={code}>
            <button
              className={code === value ? 'state-opt on' : 'state-opt'}
              aria-pressed={code === value}
              data-autofocus={code === value ? true : undefined}
              onClick={() => {
                onPick(code)
                onClose()
              }}
            >
              <MapPin size={16} aria-hidden />
              <span>{name}</span>
              {code === value && <Check size={18} aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
