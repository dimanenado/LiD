import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Theme } from './store'
import { Modal } from './ui'

interface ConfirmOpts {
  title: string
  body?: string
  ok: string
  cancel?: string
  danger?: boolean
}

/** In-app replacement for window.confirm. Returns [ask, element]; render the element once. */
export function useConfirm(): [(o: ConfirmOpts) => Promise<boolean>, ReactNode] {
  const [req, setReq] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const ask = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setReq({ ...o, resolve })), [])
  const done = useCallback(
    (v: boolean) => {
      req?.resolve(v)
      setReq(null)
    },
    [req],
  )
  const close = useCallback(() => done(false), [done])
  const el = req && (
    <Modal title={req.title} onClose={close}>
      {req.body && <p className="modal-body">{req.body}</p>}
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={close}>
          {req.cancel ?? 'Cancel'}
        </button>
        <button className={`btn ${req.danger ? 'btn-danger' : 'btn-primary'}`} data-autofocus onClick={() => done(true)}>
          {req.ok}
        </button>
      </div>
    </Modal>
  )
  return [ask, el]
}

/** Small transient message at the bottom of the screen. */
export function useToast(): [(msg: string) => void, ReactNode] {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2600)
    return () => clearTimeout(t)
  }, [msg])
  return [setMsg, msg && <div className="toast" role="status">{msg}</div>]
}

/** Puts the resolved theme on <html data-theme> and keeps it in step with the device while "system" is chosen. */
export function useTheme(theme: Theme) {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const t = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = t
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0f131a' : '#f4f6f9')
    }
    apply()
    if (theme !== 'system') return
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
