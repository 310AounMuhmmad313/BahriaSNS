import CrudPage from '../../components/admin/CrudPage'

export default function AchievementsAdmin() {
  return (
    <CrudPage
      title="Achievements"
      singular="Achievement"
      table="achievements"
      orderBy="year"
      introNote="Only publish results, awards and distinctions that are verified by official school documentation."
      fields={[
        { name: 'title', label: 'Title', required: true, colSpan: 2 },
        { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
        {
          name: 'category', label: 'Category', type: 'select', required: true,
          options: ['result', 'award', 'competition', 'scholarship', 'alumni'].map((v) => ({ value: v, label: v })),
        },
        { name: 'year', label: 'Year', type: 'number', min: 1990, max: 2100 },
        { name: 'student_name', label: 'Student name' },
        { name: 'image_url', label: 'Photo (optional)', type: 'image' },
        { name: 'is_active', label: 'Visible on website', type: 'toggle' },
      ]}
      columns={[
        {
          header: 'Achievement',
          render: (a) => (
            <div className="max-w-sm">
              <div className="font-semibold text-navy-900">{a.title}</div>
              {a.student_name ? <div className="text-xs text-slate-400">{a.student_name}</div> : null}
            </div>
          ),
        },
        { header: 'Category', render: (a) => <span className="badge badge-gold">{a.category}</span> },
        { header: 'Year', render: (a) => <span className="font-bold text-navy-800">{a.year || '—'}</span> },
        { header: 'Visible', render: (a) => <span className={a.is_active ? 'badge badge-approved' : 'badge badge-gray'}>{a.is_active ? 'yes' : 'no'}</span> },
      ]}
    />
  )
}
