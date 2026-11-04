import { useEffect, useMemo, useState } from 'react'
import { useSettings } from '../../hooks/useSiteSettings'
import { useToast } from '../../context/ToastContext'
import { settingsApi } from '../../lib/api'
import { SETTING_GROUPS, FIELD_META, DEFAULT_SETTINGS } from '../../lib/settings'
import { Input, Textarea } from '../../components/ui/Fields'
import { AsyncBlock } from '../../components/ui/Bits'
import Icon from '../../components/ui/icons'
import { cn } from '../../lib/utils'

/**
 * Website content manager — every editable heading, message and
 * contact detail on the public site, stored in site_settings.
 * No source-code changes required to update the website.
 */
export default function ContentAdmin() {
  const toast = useToast()
  const { map, refresh } = useSettings()
  const [active, setActive] = useState(SETTING_GROUPS[0].group)
  const [drafts, setDrafts] = useState({})
  const [dirty, setDirty] = useState({})
  const [busy, setBusy] = useState(false)

  const group = SETTING_GROUPS.find((g) => g.group === active)

  useEffect(() => {
    if (!map) return
    setDrafts((current) => {
      const unsaved = Object.fromEntries(
        Object.keys(dirty)
          .filter((key) => dirty[key])
          .map((key) => [key, current[key]])
      )
      return { ...DEFAULT_SETTINGS, ...map, ...unsaved }
    })
  }, [map, dirty])

  const setVal = (key) => (e) => {
    const v = e.target.value
    setDrafts((d) => ({ ...d, [key]: v }))
    setDirty((x) => ({ ...x, [key]: true }))
  }

  const changedKeys = useMemo(() => Object.keys(dirty).filter((k) => dirty[k]), [dirty])

  const save = async () => {
    if (!changedKeys.length) return
    setBusy(true)
    try {
      await settingsApi.upsert(changedKeys.map((key) => ({ key, value: drafts[key] ?? '' })))
      toast.success(`Saved ${changedKeys.length} change(s) — visible on the website immediately.`)
      setDirty({})
      await refresh()
    } catch (e) {
      toast.error(e.message || 'Could not save changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gold-300 bg-gold-100/40 px-5 py-3 text-xs leading-relaxed text-navy-800">
        Edit the public website's headings, texts and contact details here. Changes appear on the live site the moment you
        save — no code deployment needed. Empty fields fall back to the built-in sample copy.
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        {/* groups */}
        <div className="card h-max overflow-hidden p-2">
          {SETTING_GROUPS.map((g) => (
            <button
              key={g.group}
              onClick={() => setActive(g.group)}
              className={cn(
                'flex w-full items-center justify-between rounded px-4 py-2.5 text-left text-sm font-semibold transition',
                active === g.group ? 'bg-navy-950 text-gold-300' : 'text-slate-600 hover:bg-navy-50'
              )}
            >
              {g.group}
              {g.keys.some((k) => dirty[k]) ? <span className="h-2 w-2 rounded-full bg-gold-500" /> : null}
            </button>
          ))}
        </div>

        {/* fields */}
       <AsyncBlock loading={false} isEmpty={false}>
          <div className="card p-6 md:p-8">
            <h3 className="h-display text-xl font-bold text-navy-900">{group.group}</h3>
            <div className="gold-line mt-3 mb-6" />
            <div className="grid gap-5">
              {group.keys.map((key) => {
                const meta = FIELD_META[key] || { label: key }
                const val = drafts[key] ?? ''
                return meta.multiline || key === 'home.values' || key === 'home.facilities' || key === 'home.stats' || key === 'admission.requirements' ? (
                  <Textarea
                    key={key}
                    label={meta.label}
                    rows={key === 'about.history_text' ? 5 : 3}
                    value={val}
                    onChange={setVal(key)}
                    help={meta.help}
                  />
                ) : (
                  <Input key={key} label={meta.label} value={val} onChange={setVal(key)} help={meta.help} />
                )
              })}
            </div>
          </div>
        </AsyncBlock>
      </div>

      {/* sticky save bar */}
      {changedKeys.length ? (
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl bg-navy-950 px-6 py-4 shadow-2xl">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-300">
            <Icon name="alert" size={14} /> {changedKeys.length} unsaved change{changedKeys.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDrafts({ ...DEFAULT_SETTINGS, ...(map || {}) })
                setDirty({})
              }}
              disabled={busy}
            >
              Discard
            </button>
            <button className="btn btn-gold btn-sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save & publish'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
