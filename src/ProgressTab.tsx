import { ChevronRight, Download, MapPin, RotateCcw, Upload } from 'lucide-react'
import { useRef } from 'react'
import { PASS } from './Exam'
import { GENERAL, STATES, TOPIC_SHORT, stateQuestions } from './data'
import { isMastered, isMistake, Store } from './store'
import { useConfirm, useToast } from './hooks'
import { Meter, Switch } from './ui'

export function ProgressTab({ store, onChangeState }: { store: Store; onChangeState: () => void }) {
  const { p, update } = store
  const fileRef = useRef<HTMLInputElement>(null)
  const [ask, confirmEl] = useConfirm()
  const [toast, toastEl] = useToast()

  const groups = [
    ...(['politics', 'history', 'society'] as const).map((t) => ({ label: TOPIC_SHORT[t], qs: GENERAL.filter((q) => q.topic === t) })),
    { label: STATES[p.state], qs: stateQuestions(p.state) },
  ]

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
      update({
        state: data.state ?? p.state,
        showEnglish: data.showEnglish ?? true,
        shuffle: data.shuffle ?? true,
        onboarded: true,
        stats: data.stats,
        exams: data.exams ?? [],
      })
      toast('Progress imported')
    } catch {
      toast('That file is not an exported progress file')
    }
  }

  const reset = async () => {
    if (
      await ask({
        title: 'Reset all progress?',
        body: 'This deletes your answers and exam history in this browser. Export first if you want to keep a copy.',
        ok: 'Reset',
        danger: true,
      })
    ) {
      update({ stats: {}, exams: [] })
      toast('Progress reset')
    }
  }

  return (
    <div className="stack">
      {confirmEl}
      {toastEl}

      <section className="stack-sm">
        <h2 className="label">Mastery</h2>
        <div className="panel">
          {groups.map(({ label, qs }) => {
            const m = qs.filter((q) => isMastered(p.stats[q.id])).length
            const r = qs.filter((q) => isMistake(p.stats[q.id])).length
            return (
              <div key={label} className="mastery">
                <div className="mastery-head">
                  <b>{label}</b>
                  <span className="muted tnum">
                    {m} / {qs.length}
                    {r > 0 && <span className="bad"> · {r} to review</span>}
                  </span>
                </div>
                <Meter value={m / qs.length} label={`${label}: ${m} of ${qs.length} mastered`} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="stack-sm">
        <h2 className="label">Exam history</h2>
        {p.exams.length === 0 ? (
          <div className="panel muted">No mock exams yet. Your results will show up here.</div>
        ) : (
          <ul className="list">
            {p.exams.slice(0, 15).map((e) => {
              const passed = e.score >= PASS
              return (
                <li key={e.date} className="list-row static">
                  <span className={`chip ${passed ? 'chip-ok' : 'chip-bad'}`}>{passed ? 'Passed' : 'Not passed'}</span>
                  <span className="row-main">
                    <b className="tnum">
                      {e.score} / {e.total}
                    </b>
                    <small>
                      {new Date(e.date).toLocaleDateString()} · {STATES[e.state]} · {Math.max(1, Math.round(e.seconds / 60))} min
                    </small>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="stack-sm">
        <h2 className="label">Settings</h2>
        <div className="list">
          <button className="list-row" onClick={onChangeState}>
            <MapPin size={18} aria-hidden className="list-icon" />
            <span className="row-main">
              <b>Federal state</b>
              <small>{STATES[p.state]}</small>
            </span>
            <ChevronRight size={18} aria-hidden className="muted" />
          </button>
          <Switch
            id="set-english"
            label="Show English translation"
            hint="Next to the German text on wide screens, under it on phones"
            checked={p.showEnglish}
            onChange={(v) => update({ showEnglish: v })}
          />
          <Switch
            id="set-shuffle"
            label="Shuffle practice questions"
            hint="Off keeps the catalog order"
            checked={p.shuffle}
            onChange={(v) => update({ shuffle: v })}
          />
        </div>
      </section>

      <section className="stack-sm">
        <h2 className="label">Your data</h2>
        <p className="muted small">Progress is saved in this browser only. Export it to move it to another device.</p>
        <div className="actions">
          <button className="btn btn-secondary" onClick={exportProgress}>
            <Download size={16} aria-hidden /> Export
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Import
          </button>
          <button className="btn btn-ghost btn-danger-text" onClick={reset}>
            <RotateCcw size={16} aria-hidden /> Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) importProgress(f)
            }}
          />
        </div>
      </section>

      <section className="stack-sm">
        <h2 className="label">About</h2>
        <p className="muted small">
          Questions from the official BAMF catalog “Gesamtfragenkatalog zum Test Leben in Deutschland” (as of 07.05.2025).
          English translations are unofficial. Answers were checked against the official BAMF online tool on 15.10.2026.
        </p>
      </section>
    </div>
  )
}
