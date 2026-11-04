import CrudPage from '../../components/admin/CrudPage'

export default function HistoryAdmin() {
  return (
    <CrudPage
      title="History & Visitors"
      singular="Entry"
      table="history_items"
      orderBy="sort_date"
      introNote="Milestones build the About-page timeline; visits appear under “Important Visitors”. Only publish visitor names and photographs that are verified."
      fields={[
        { name: 'title', label: 'Title', required: true, colSpan: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
        {
          name: 'item_type', label: 'Type', type: 'select', required: true,
          options: [{ value: 'milestone', label: 'History milestone' }, { value: 'visit', label: 'Important visitor / ceremony' }],
        },
        { name: 'date_label', label: 'Date label', placeholder: 'e.g. 1995 or 14 Aug 2024', help: 'Shown as-is on the timeline / card.' },
        { name: 'sort_date', label: 'Sort date', type: 'date', help: 'Used only for ordering.' },
        { name: 'visitor_name', label: 'Visitor name (for visits)' },
        { name: 'visitor_designation', label: 'Visitor designation (for visits)' },
        { name: 'image_url', label: 'Photograph', type: 'image' },
        { name: 'is_active', label: 'Visible on website', type: 'toggle' },
      ]}
      columns={[
        {
          header: 'Entry',
          render: (h) => (
            <div className="max-w-sm">
              <div className="font-semibold text-navy-900">{h.title}</div>
              <div className="text-xs text-slate-400">{h.date_label || '—'}</div>
            </div>
          ),
        },
        { header: 'Type', render: (h) => <span className={h.item_type === 'visit' ? 'badge badge-gold' : 'badge badge-navy'}>{h.item_type}</span> },
        {
          header: 'Visitor',
          render: (h) => (
            <span className="text-xs text-slate-500">
              {h.visitor_name ? `${h.visitor_name}${h.visitor_designation ? ` · ${h.visitor_designation}` : ''}` : '—'}
            </span>
          ),
        },
        { header: 'Visible', render: (h) => <span className={h.is_active ? 'badge badge-approved' : 'badge badge-gray'}>{h.is_active ? 'yes' : 'no'}</span> },
      ]}
    />
  )
}
