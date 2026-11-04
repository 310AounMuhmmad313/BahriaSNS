import CrudPage from '../../components/admin/CrudPage'

const CATS = ['principal', 'vice_principal', 'teacher', 'staff']

export default function FacultyAdmin() {
  return (
    <CrudPage
      title="Faculty"
      singular="Faculty member"
      table="faculty"
      orderBy="display_order"
      ascending
      introNote="Principal and Vice Principal profiles also appear on the About page. Inactive profiles are hidden from the public site."
      fields={[
        { name: 'name', label: 'Full name', required: true },
        { name: 'designation', label: 'Designation', required: true, placeholder: 'e.g. Senior Teacher — Mathematics' },
        { name: 'category', label: 'Category', type: 'select', required: true, options: CATS.map((v) => ({ value: v, label: v.replace('_', ' ') })) },
        { name: 'department', label: 'Department / subject', placeholder: 'e.g. Science Department' },
        { name: 'qualification', label: 'Qualification', placeholder: 'e.g. M.Sc, B.Ed' },
        { name: 'display_order', label: 'Display order', type: 'number', help: 'Lower numbers appear first.' },
        { name: 'bio', label: 'Biography', type: 'textarea', rows: 4, colSpan: 2 },
        { name: 'photo_url', label: 'Photograph', type: 'image' },
        { name: 'is_active', label: 'Visible on website', type: 'toggle' },
      ]}
      columns={[
        {
          header: 'Member',
          render: (f) => (
            <div className="flex items-center gap-3">
              {f.photo_url ? (
                <img src={f.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-[10px] font-black text-gold-300">
                  {f.name?.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}
                </div>
              )}
              <div>
                <div className="font-semibold text-navy-900">{f.name}</div>
                <div className="text-xs text-slate-400">{f.designation}</div>
              </div>
            </div>
          ),
        },
        { header: 'Category', render: (f) => <span className="badge badge-gold">{f.category.replace('_', ' ')}</span> },
        { header: 'Department', render: (f) => <span className="text-xs text-slate-500">{f.department || '—'}</span> },
        { header: 'Visible', render: (f) => <span className={f.is_active ? 'badge badge-approved' : 'badge badge-gray'}>{f.is_active ? 'yes' : 'no'}</span> },
      ]}
    />
  )
}
