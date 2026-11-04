import CrudPage from '../../components/admin/CrudPage'
import { fmtDate } from '../../lib/utils'

export default function EventsAdmin() {
  return (
    <CrudPage
      title="Events"
      singular="Event"
      table="events"
      orderBy="event_date"
      introNote="Events appear on the public Events page (upcoming first) and can be featured on the homepage."
      fields={[
        { name: 'title', label: 'Event title', required: true, colSpan: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 5 },
        { name: 'event_date', label: 'Event date', type: 'date', required: true },
        { name: 'location', label: 'Location' },
        {
          name: 'category', label: 'Category', type: 'select',
          options: ['ceremony', 'sports', 'academic', 'trip', 'general'].map((v) => ({ value: v, label: v })),
        },
        { name: 'status', label: 'Status', type: 'select', options: [{ value: 'published', label: 'published' }, { value: 'unpublished', label: 'unpublished' }] },
        { name: 'video_url', label: 'Video URL (YouTube)', colSpan: 2, help: 'Optional — shown inside the event details popup.' },
        { name: 'cover_url', label: 'Cover image', type: 'image' },
      ]}
      columns={[
        {
          header: 'Event',
          render: (e) => (
            <div className="flex items-center gap-3">
              {e.cover_url ? (
                <img src={e.cover_url} alt="" className="h-10 w-14 rounded object-cover" />
              ) : (
                <div className="h-10 w-14 rounded bg-navy-50" />
              )}
              <div className="font-semibold text-navy-900">{e.title}</div>
            </div>
          ),
        },
        { header: 'Date', render: (e) => <span className="text-xs">{fmtDate(e.event_date)}</span> },
        { header: 'Location', render: (e) => <span className="text-xs text-slate-500">{e.location || '—'}</span> },
        { header: 'Status', render: (e) => <span className={e.status === 'published' ? 'badge badge-approved' : 'badge badge-gray'}>{e.status}</span> },
      ]}
    />
  )
}
