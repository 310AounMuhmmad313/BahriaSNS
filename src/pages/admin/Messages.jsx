import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { messagesApi } from '../../lib/api'
import { fmtDateTime, cn } from '../../lib/utils'
import { AsyncBlock } from '../../components/ui/Bits'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import Icon from '../../components/ui/icons'

export default function MessagesAdmin() {
  const toast = useToast()
  const { data, loading, error, refetch } = useAsync(() => messagesApi.list(), [])
  const [active, setActive] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

  const rows = (data || []).filter((m) => (filter === 'unread' ? !m.is_read : true))
  const unread = (data || []).filter((m) => !m.is_read).length

  const open = async (m) => {
    setActive(m)
    if (!m.is_read) {
      try {
        await messagesApi.markRead(m.id, true)
        refetch()
      } catch { /* non-critical */ }
    }
  }

  const remove = async () => {
    try {
      await messagesApi.remove(deleting.id)
      toast.success('Enquiry deleted.')
      setDeleting(null)
      setActive(null)
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex gap-2">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition',
                filter === f ? 'border-gold-500 bg-gold-500 text-navy-950' : 'border-slate-200 text-slate-500 hover:border-gold-400'
              )}
            >
              {f} {f === 'unread' && unread ? `(${unread})` : ''}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{rows.length} enquiry{rows.length === 1 ? '' : 's'}</span>
      </div>

      <div className="card overflow-hidden">
        <AsyncBlock {...{ data: rows, loading, error }} empty={<p className="px-6 py-12 text-center text-sm text-slate-400">No enquiries yet. Messages from the public “Contact Us” form appear here.</p>}>
          <ul className="divide-y divide-slate-100">
            {rows.map((m) => (
              <li key={m.id}>
                <button onClick={() => open(m)} className={cn('flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-navy-50/60', !m.is_read && 'bg-gold-100/30')}>
                  <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', m.is_read ? 'bg-slate-200' : 'bg-gold-500')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-navy-900">{m.subject}</span>
                      <span className="text-xs text-slate-400">· {m.name}</span>
                      {!m.is_read ? <span className="badge badge-gold">new</span> : null}
                    </span>
                    <span className="clamp-1 mt-0.5 block text-xs text-slate-500">{m.message}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-400">{fmtDateTime(m.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </AsyncBlock>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.subject || 'Enquiry'} wide>
        {active ? (
          <div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded bg-navy-50 px-4 py-3 text-xs">
              <span><b>From:</b> {active.name}</span>
              <span><b>Email:</b> <a className="text-gold-600 hover:underline" href={`mailto:${active.email}`}>{active.email}</a></span>
              {active.phone ? <span><b>Phone:</b> {active.phone}</span> : null}
              <span className="text-slate-400">{fmtDateTime(active.created_at)}</span>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{active.message}</p>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-navy-100 pt-4">
              <a className="btn btn-gold btn-sm" href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject)}`}>
                <Icon name="mail" size={14} /> Reply by email
              </a>
              {!active.is_read ? (
                <button className="btn btn-ghost btn-sm" onClick={async () => { await messagesApi.markRead(active.id, true); refetch(); setActive({ ...active, is_read: true }) }}>
                  Mark unread → read
                </button>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={async () => { await messagesApi.markRead(active.id, false); refetch(); setActive({ ...active, is_read: false }) }}>
                  Mark as unread
                </button>
              )}
              <button className="btn btn-ghost btn-sm text-red-600" onClick={() => setDeleting(active)}>
                <Icon name="trash" size={13} /> Delete
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete enquiry?"
        confirmLabel="Delete"
        body={`Delete “${deleting?.subject}” from ${deleting?.name}? This cannot be undone.`}
      />
    </div>
  )
}
