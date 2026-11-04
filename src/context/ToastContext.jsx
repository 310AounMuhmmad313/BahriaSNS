import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastCtx = createContext(null)

let idc = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback(
    (type, message, ms = 4200) => {
      const id = ++idc
      setToasts((t) => [...t.slice(-3), { id, type, message }])
      timers.current[id] = setTimeout(() => remove(id), ms)
    },
    [remove]
  )

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m, 6000),
      info: (m) => push('info', m),
    }),
    [push]
  )

  const styles = {
    success: { bg: '#064e3b', border: '#10b981', icon: '✓' },
    error: { bg: '#7f1d1d', border: '#ef4444', icon: '!' },
    info: { bg: '#0b2440', border: '#c9a227', icon: 'i' },
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 no-print" style={{ maxWidth: 'min(92vw, 380px)' }}>
        {toasts.map((t) => {
          const s = styles[t.type] || styles.info
          return (
            <div
              key={t.id}
              className="toast-in flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-semibold text-white shadow-2xl"
              style={{ background: s.bg, borderColor: s.border }}
              role="status"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                style={{ background: s.border, color: s.bg }}
              >
                {s.icon}
              </span>
              <span className="leading-snug">{t.message}</span>
              <button onClick={() => remove(t.id)} className="ml-1 shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
