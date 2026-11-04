import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import { cn } from '../../lib/utils'
import Icon from '../ui/icons'

/**
 * Prominent urgent banner (sudden holiday / early closure / emergency),
 * managed by admins from the dashboard. Fixed at the very top; the
 * navbar shifts down while it is visible.
 */
export default function UrgentBanner({ onActive }) {
  const { data, loading } = useAsync(() => contentApi.notices(), [])
  const [dismissed, setDismissed] = useState([])

  const urgent = (data || []).filter((n) => n.is_emergency && !dismissed.includes(n.id))
  const notice = urgent[0]

  useEffect(() => {
    onActive?.(Boolean(notice))
    return () => onActive?.(false)
  }, [notice, onActive])

  if (loading || !notice) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[95] h-[52px] overflow-hidden bg-gradient-to-r from-red-900 via-navy-900 to-navy-950 shadow-lg">
      <div className="container-x flex h-full items-center gap-3">
        <span className="pulse-dot h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
        <span className="badge badge-urgent shrink-0">Urgent</span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">
          {notice.title}
          <span className="ml-2 hidden font-normal text-navy-200 md:inline">{notice.body}</span>
        </p>
        <Link
          to="/notices"
          className="hidden shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-widest text-gold-300 hover:text-gold-200 sm:flex"
        >
          Details <Icon name="arrowRight" size={13} />
        </Link>
        <button
          onClick={() => setDismissed((d) => [...d, notice.id])}
          className="shrink-0 text-navy-300 transition hover:text-white"
          aria-label="Dismiss urgent banner"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className={cn('absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent')} />
    </div>
  )
}
