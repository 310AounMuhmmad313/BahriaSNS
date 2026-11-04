import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic async data hook.
 *   const { data, loading, error, refetch } = useAsync(() => api.something(), [])
 * `fn` is kept in a ref so callers can pass inline arrows safely.
 */
export function useAsync(fn, deps = [], { enabled = true } = {}) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [state, setState] = useState({ data: null, loading: Boolean(enabled), error: null })

  const run = useCallback(
    async (quiet = false) => {
      if (!enabled) return undefined
      if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await fnRef.current()
        setState({ data, loading: false, error: null })
        return data
      } catch (err) {
        setState((s) => ({ ...s, loading: false, error: err }))
        return undefined
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, enabled]
  )

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  return { ...state, refetch: () => run(true) }
}
