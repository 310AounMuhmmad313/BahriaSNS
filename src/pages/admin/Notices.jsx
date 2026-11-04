import CrudPage from '../../components/admin/CrudPage'
import { useToast } from '../../context/ToastContext'
import { sb } from '../../lib/supabase'
import { fmtDateTime, statusClass } from '../../lib/utils'
import Icon from '../../components/ui/icons'

const STATUSES = ['published', 'unpublished', 'archived'].map((v) => ({ value: v, label: v }))

export default function NoticesAdmin() {
  const toast = useToast()

  const toggleStatus = async (row, status, refetch) => {
    try {
      const { error } = await sb().from('notices').update({ status }).eq('id', row.id)
      if (error) throw error
      toast.success(`Notice ${status}.`)
      refetch?.()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <CrudPage
      title="Notices & Alerts"
      singular="Notice"
      table="notices"
      orderBy="publish_at"
      introNote="Emergency notices appear as a red banner at the top of the public website. Pinned notices float to the top of the notice board. Expired notices disappear automatically."
      fields={[
        { name: 'title', label: 'Title', required: true, colSpan: 2 },
        { name: 'body', label: 'Description', type: 'textarea', required: true, rows: 5 },
        {
          name: 'category', label: 'Category', type: 'select', required: true,
          options: ['urgent', 'holiday', 'admission', 'event', 'general'].map((v) => ({ value: v, label: v })),
        },
        {
          name: 'audience', label: 'Audience', type: 'select',
          options: ['all', 'students', 'parents', 'staff'].map((v) => ({ value: v, label: v })),
        },
        { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
        { name: 'publish_at', label: 'Publish date & time', type: 'datetime', help: 'Defaults to now when left empty.' },
        { name: 'expires_at', label: 'Expiry (optional)', type: 'datetime' },
        { name: 'pinned', label: 'Pin to homepage & top of notice board', type: 'toggle' },
        { name: 'is_emergency', label: 'Show as urgent emergency banner', type: 'toggle', help: 'Use for sudden holidays, early closures and emergencies.' },
        { name: 'media_url', label: 'Poster image URL (optional)', colSpan: 2, help: 'Upload an image in Admin → Gallery, or paste any image URL.' },
        { name: 'media_type', label: 'Media type', type: 'select', options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }, { value: 'file', label: 'File' }] },
      ]}
      columns={[
        {
          header: 'Notice',
          render: (n) => (
            <div className="max-w-md">
              <div className="font-semibold text-navy-900">{n.title}</div>
              <div className="clamp-1 text-xs text-slate-400">{n.body}</div>
            </div>
          ),
        },
        { header: 'Category', render: (n) => <span className="badge badge-navy">{n.category}</span> },
        {
          header: 'Flags',
          render: (n) => (
            <div className="flex flex-wrap gap-1">
              {n.is_emergency ? <span className="badge badge-urgent">Urgent</span> : null}
              {n.pinned ? <span className="badge badge-gold">Pinned</span> : null}
            </div>
          ),
        },
        { header: 'Publishes', render: (n) => <span className="text-xs text-slate-500">{fmtDateTime(n.publish_at || n.created_at)}</span> },
        { header: 'Status', render: (n) => <span className={n.status === 'published' ? 'badge badge-approved' : 'badge badge-gray'}>{n.status}</span> },
      ]}
      extraActions={(row, refetch) =>
        row.status === 'published' ? (
          <button className="btn btn-ghost btn-sm" title="Unpublish" onClick={() => toggleStatus(row, 'unpublished', refetch)}>
            <Icon name="x" size={13} />
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" title="Publish" onClick={() => toggleStatus(row, 'published', refetch)}>
            <Icon name="check" size={13} />
          </button>
        )
      }
    />
  )
}
