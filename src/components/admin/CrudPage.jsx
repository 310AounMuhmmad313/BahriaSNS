import { useMemo, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { sb } from '../../lib/supabase'
import { BUCKETS } from '../../lib/supabase'
import { storageApi, audit, fetchAll, insertRow, updateRow, deleteRow } from '../../lib/api'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Input, Select, Textarea, Toggle, FilePick } from '../../components/ui/Fields'
import { AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'
import { cn, fileSize } from '../../lib/utils'

/* ============================================================
   Generic admin CRUD page: list + search + create/edit/delete
   driven by a `fields` config. Field types:
   text · number · textarea · select · date · datetime · toggle · image
   ============================================================ */

export default function CrudPage({
  title,
  singular,
  table,
  fields,
  columns,
  orderBy = 'created_at',
  ascending = false,
  extraActions,
  introNote,
}) {
  const toast = useToast()
  const { data, loading, error, refetch } = useAsync(() => fetchAll(table, { order: orderBy, asc: ascending }), [table])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const rows = useMemo(() => {
    let r = data || []
    if (q.trim()) {
      const s = q.toLowerCase()
      r = r.filter((row) => JSON.stringify(row).toLowerCase().includes(s))
    }
    return r
  }, [data, q])

  const openNew = () => {
    const init = {}
    for (const f of fields) init[f.name] = f.type === 'toggle' ? Boolean(f.default) : f.default ?? (f.type === 'select' ? '' : '')
    setForm(init)
    setErrors({})
    setEditing('new')
  }

  const openEdit = (row) => {
    const init = {}
    for (const f of fields) {
      let v = row[f.name]
      if (f.type === 'datetime' && v) v = new Date(v).toISOString().slice(0, 16)
      if (f.type === 'date' && v) v = String(v).slice(0, 10)
      init[f.name] = v ?? (f.type === 'toggle' ? false : '')
    }
    setForm(init)
    setErrors({})
    setEditing(row)
  }

  const setF = (name) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => ({ ...f, [name]: v }))
    setErrors((er) => ({ ...er, [name]: undefined }))
  }

  const save = async () => {
    const er = {}
    for (const f of fields) {
      const v = form[f.name]
      if (f.required && (v === '' || v === null || v === undefined || (f.type === 'image' && !v))) er[f.name] = `${f.label} is required.`
      if (f.type === 'number' && v !== '' && isNaN(Number(v))) er[f.name] = 'Enter a valid number.'
    }
    setErrors(er)
    if (Object.keys(er).length) {
      toast.error('Please fill the required fields.')
      return
    }

    setBusy(true)
    try {
      const payload = {}
      for (const f of fields) {
        let v = form[f.name]
        if (f.type === 'number') v = v === '' ? null : Number(v)
        if (f.type === 'datetime') v = v ? new Date(v).toISOString() : null
        if (f.type === 'date') v = v || null
        // image upload
        if (f.type === 'image' && v instanceof File) {
          v = await storageApi.uploadPublic(`${table}`, v)
        }
        payload[f.name] = v
      }
      if (editing === 'new') {
        await insertRow(table, payload)
        await audit('create', table, payload.title || payload.name || '', {})
        toast.success(`${singular} created.`)
      } else {
        await updateRow(table, editing.id, payload)
        await audit('update', table, editing.title || editing.name || editing.id, {})
        toast.success(`${singular} updated.`)
      }
      setEditing(null)
      refetch()
    } catch (e) {
      toast.error(e.message || `Could not save the ${singular.toLowerCase()}.`)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteRow(table, deleting.id)
      await audit('delete', table, deleting.title || deleting.name || deleting.id, {})
      toast.success(`${singular} deleted.`)
      setDeleting(null)
      refetch()
    } catch (e) {
      toast.error(e.message || 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {introNote ? <div className="rounded-lg border border-gold-300 bg-gold-100/40 px-5 py-3 text-xs leading-relaxed text-navy-800">{introNote}</div> : null}

      {/* toolbar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="relative min-w-[200px] flex-1 md:max-w-xs">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="input pl-9" />
        </div>
        <button className="btn btn-gold btn-sm" onClick={openNew}>
          <Icon name="plus" size={14} /> Add {singular.toLowerCase()}
        </button>
      </div>

      {/* list */}
      <div className="card overflow-hidden">
        <AsyncBlock {...{ data: rows, loading, error }} empty={<p className="px-6 py-12 text-center text-sm text-slate-400">Nothing here yet — click “Add {singular.toLowerCase()}” to create the first entry.</p>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.header}>{c.header}</th>
                  ))}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.header}>{c.render(row)}</td>
                    ))}
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {extraActions ? extraActions(row, refetch) : null}
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                          <Icon name="edit" size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-red-600" onClick={() => setDeleting(row)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {rows.length} record{rows.length === 1 ? '' : 's'}
          </div>
        </AsyncBlock>
      </div>

      {/* create / edit modal */}
      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const wide = f.colSpan === 2 || ['textarea', 'image'].includes(f.type)
            return (
              <div key={f.name} className={cn(wide && 'sm:col-span-2')}>
                {f.type === 'textarea' ? (
                  <Textarea label={f.label} required={f.required} rows={f.rows || 4} value={form[f.name] || ''} onChange={setF(f.name)} error={errors[f.name]} help={f.help} />
                ) : f.type === 'select' ? (
                  <Select label={f.label} required={f.required} value={form[f.name] ?? ''} onChange={setF(f.name)} error={errors[f.name]} help={f.help}>
                    <option value="">Select…</option>
                    {(typeof f.options === 'function' ? f.options() : f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                ) : f.type === 'toggle' ? (
                  <div className="pt-1">
                    <Toggle label={f.label} checked={Boolean(form[f.name])} onChange={(v) => setF(f.name)(v)} hint={f.help} />
                  </div>
                ) : f.type === 'image' ? (
                  <ImageField label={f.label} value={form[f.name]} onChange={setF(f.name)} error={errors[f.name]} />
                ) : (
                  <Input
                    label={f.label}
                    required={f.required}
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                    value={form[f.name] ?? ''}
                    onChange={setF(f.name)}
                    error={errors[f.name]}
                    placeholder={f.placeholder}
                    help={f.help}
                    step={f.step}
                    min={f.min}
                    max={f.max}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-navy-100 pt-4">
          <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
          <button className="btn btn-gold" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : editing === 'new' ? `Create ${singular.toLowerCase()}` : 'Save changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        busy={busy}
        title={`Delete ${singular.toLowerCase()}?`}
        confirmLabel="Delete permanently"
        body={`This will permanently remove “${deleting?.title || deleting?.name || 'this entry'}” from the website. This action is recorded in the audit log.`}
      />
    </div>
  )
}

/* image field: shows preview, accepts new upload or keeps existing URL */
function ImageField({ label, value, onChange, error }) {
  const isFile = value instanceof File
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded border border-navy-100 bg-navy-50">
          {isFile ? (
            <img src={URL.createObjectURL(value)} alt="" className="h-full w-full object-cover" />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300"><Icon name="image" size={22} /></div>
          )}
        </div>
        <div className="flex-1">
          <FilePick
            file={isFile ? value : null}
            onSelect={(file, err) => onChange(err ? value : file)}
            onClear={() => onChange('')}
            help={undefined}
          />
          {!isFile && value ? (
            <div className="mt-1 text-[11px] text-slate-400">Current image URL kept — choose a file above to replace it.</div>
          ) : null}
          {error ? <div className="err-text">{error}</div> : null}
        </div>
      </div>
    </div>
  )
}
