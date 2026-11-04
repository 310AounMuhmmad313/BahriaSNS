import { useAsync } from '../../hooks/useAsync'
import { contentApi } from '../../lib/api'
import CrudPage from '../../components/admin/CrudPage'

export default function GalleryAdmin() {
  const events = useAsync(() => contentApi.events(), [])

  const fields = [
    { name: 'title', label: 'Title', colSpan: 2 },
    { name: 'caption', label: 'Caption', type: 'textarea', rows: 2 },
    {
      name: 'type', label: 'Media type', type: 'select', required: true,
      options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }],
    },
    {
      name: 'category', label: 'Category', type: 'select', required: true,
      options: ['campus', 'sports', 'academic', 'ceremony', 'trip', 'general'].map((v) => ({ value: v, label: v })),
    },
    {
      name: 'event_id', label: 'Linked event (optional)', type: 'select',
      options: (events.data || []).map((e) => ({ value: e.id, label: e.title })),
    },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'published', label: 'published' }, { value: 'unpublished', label: 'unpublished' }] },
    { name: 'url', label: 'Photo / video', type: 'image', required: true, colSpan: 2, help: 'Upload an image, or paste a video URL in the field below.' },
    { name: 'video_url', label: 'Video URL (alternative)', help: 'If media type is Video you may paste an mp4/YouTube URL here instead of uploading. The public gallery uses the URL field.' },
  ]

  return (
    <CrudPage
      title="Gallery"
      singular="Gallery item"
      table="gallery_items"
      fields={fields}
      introNote="Large images/videos are stored in Supabase Storage (public-media bucket), never inside the database row itself."
      columns={[
        {
          header: 'Preview',
          render: (g) =>
            g.type === 'video' ? (
              <span className="badge badge-navy">video</span>
            ) : (
              <img src={g.url} alt="" className="h-10 w-14 rounded object-cover" />
            ),
        },
        { header: 'Title', render: (g) => <span className="font-semibold text-navy-900">{g.title || '—'}</span> },
        { header: 'Category', render: (g) => <span className="badge badge-navy">{g.category || '—'}</span> },
        { header: 'Status', render: (g) => <span className={g.status === 'published' ? 'badge badge-approved' : 'badge badge-gray'}>{g.status}</span> },
      ]}
    />
  )
}
