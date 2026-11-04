import CrudPage from '../../components/admin/CrudPage'

export default function ClassesAdmin() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gold-300 bg-gold-100/40 px-5 py-3 text-xs leading-relaxed text-navy-800">
        Classes and academic years feed the public admission form and the Academics page. Keep exactly one academic year
        <b> active</b> at a time — it becomes the default year for new applications.
      </div>

      <CrudPage
        title="Classes"
        singular="Class"
        table="classes"
        orderBy="display_order"
        ascending
        fields={[
          { name: 'name', label: 'Class name', required: true, placeholder: 'e.g. Class 6' },
          { name: 'level', label: 'Level', type: 'number', help: 'Numeric order for sorting.' },
          { name: 'description', label: 'Short description', colSpan: 2 },
          { name: 'display_order', label: 'Display order', type: 'number' },
          { name: 'is_active', label: 'Open for admission', type: 'toggle' },
        ]}
        columns={[
          { header: 'Class', render: (c) => <span className="font-semibold text-navy-900">{c.name}</span> },
          { header: 'Level', render: (c) => <span className="text-xs">{c.level ?? '—'}</span> },
          { header: 'Description', render: (c) => <span className="text-xs text-slate-500">{c.description || '—'}</span> },
          { header: 'Admissions', render: (c) => <span className={c.is_active ? 'badge badge-approved' : 'badge badge-gray'}>{c.is_active ? 'open' : 'closed'}</span> },
        ]}
      />

      <CrudPage
        title="Academic Years"
        singular="Academic year"
        table="academic_years"
        orderBy="label"
        fields={[
          { name: 'label', label: 'Year label', required: true, placeholder: 'e.g. 2026-2027' },
          { name: 'is_active', label: 'Active admission year', type: 'toggle' },
        ]}
        columns={[
          { header: 'Year', render: (y) => <span className="font-semibold text-navy-900">{y.label}</span> },
          { header: 'Status', render: (y) => <span className={y.is_active ? 'badge badge-gold' : 'badge badge-gray'}>{y.is_active ? 'active' : 'inactive'}</span> },
        ]}
      />
    </div>
  )
}
