import { useId } from 'react'
import { cn, fileSize, validateFile } from '../../lib/utils'

export function Field({ label, error, help, required, dark, children, className }) {
  return (
    <div className={className}>
      {label ? (
        <label className={cn('label', dark && 'label-dark')}>
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <div className="err-text">{error}</div> : null}
      {!error && help ? <div className="help-text">{help}</div> : null}
    </div>
  )
}

export function Input({ label, error, help, required, dark, className, ...props }) {
  return (
    <Field label={label} error={error} help={help} required={required} dark={dark} className={className}>
      <input className={cn('input', dark && 'input-dark', error && 'input-error')} {...props} />
    </Field>
  )
}

export function Select({ label, error, help, required, dark, className, children, ...props }) {
  return (
    <Field label={label} error={error} help={help} required={required} dark={dark} className={className}>
      <select className={cn('select', dark && 'input-dark', error && 'input-error')} {...props}>
        {children}
      </select>
    </Field>
  )
}

export function Textarea({ label, error, help, required, dark, className, rows = 4, ...props }) {
  return (
    <Field label={label} error={error} help={help} required={required} dark={dark} className={className}>
      <textarea rows={rows} className={cn('textarea', dark && 'input-dark', error && 'input-error')} {...props} />
    </Field>
  )
}

export function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 py-1">
      <span
        onClick={(e) => {
          e.preventDefault()
          onChange(!checked)
        }}
        className={cn(
          'relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-gold-500 bg-gold-500' : 'border-slate-300 bg-slate-200'
        )}
        style={{ height: 22 }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')}
        />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      </span>
    </label>
  )
}

/** Validated file picker used by the admission wizard and admin forms. */
export function FilePick({ label, required, file, error, onSelect, onClear, accept = 'image/*,application/pdf', help, maxMB = 5 }) {
  const id = useId()
  return (
    <Field label={label} required={required} error={error} help={help}>
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={id}
          className="btn btn-ghost btn-sm cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) handleSelect(f)
          }}
        >
          Choose file
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleSelect(f)
            e.target.value = ''
          }}
        />
        {file ? (
          <span className="flex items-center gap-2 rounded border border-navy-100 bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-800">
            <span className="max-w-[180px] truncate">{file.name}</span>
            <span className="text-slate-400">{fileSize(file.size)}</span>
            <button type="button" className="text-red-500 hover:text-red-700" onClick={onClear} aria-label="Remove file">
              ✕
            </button>
          </span>
        ) : (
          <span className="text-xs text-slate-400">PDF or JPG / PNG · max {maxMB} MB</span>
        )}
      </div>
    </Field>
  )

  function handleSelect(f) {
    const err = validateFile(f, { maxMB })
    onSelect(f, err)
  }
}
