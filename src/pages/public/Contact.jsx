import { useState } from 'react'
import { useSettings } from '../../hooks/useSiteSettings'
import { useToast } from '../../context/ToastContext'
import { messagesApi } from '../../lib/api'
import { isEmail, digits } from '../../lib/utils'
import { Reveal, RevealGroup } from '../../components/ui/motion'
import { PageHero, ConfigNotice } from '../../components/ui/Bits'
import { Input, Textarea } from '../../components/ui/Fields'
import Icon from '../../components/ui/icons'

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' }

export default function Contact() {
  const { get } = useSettings()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (form.name.trim().length < 3) er.name = 'Please enter your full name.'
    if (!isEmail(form.email)) er.email = 'Please enter a valid email address.'
    if (digits(form.phone).length < 10) er.phone = 'Please enter a valid phone number.'
    if (form.subject.trim().length < 3) er.subject = 'Please enter a subject.'
    if (form.message.trim().length < 10) er.message = 'Your message is a little short — at least 10 characters.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await messagesApi.create({ ...form, name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim() })
      setSent(true)
      setForm(EMPTY)
      toast.success('Your enquiry has been sent to the school office.')
    } catch (err) {
      if (/not configured/i.test(err.message)) toast.error(err.message)
      else toast.error('Could not send your enquiry. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const info = [
    { icon: 'pin', label: 'Address', value: get('contact.address') },
    { icon: 'phone', label: 'Phone', value: get('contact.phone'), href: `tel:${get('contact.phone')}` },
    { icon: 'mail', label: 'Email', value: get('contact.email'), href: `mailto:${get('contact.email')}` },
    { icon: 'clock', label: 'Office hours', value: get('contact.hours') },
  ]

  return (
    <>
      <PageHero
        kicker="Get in touch"
        title="Contact the School"
        text="Questions about admissions, academics or school life? Send an enquiry — the office will respond during working hours."
      />

      <section className="section-pad bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* info */}
          <div>
            <RevealGroup className="space-y-4">
              {info.map((i) => (
                <div key={i.label} data-stagger className="flex gap-5 rounded-lg border border-navy-100 bg-navy-50/40 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-400">
                    <Icon name={i.icon} size={19} />
                  </span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-gold-600">{i.label}</span>
                    {i.href ? (
                      <a href={i.href} className="mt-0.5 block font-semibold text-navy-900 hover:text-gold-600">{i.value}</a>
                    ) : (
                      <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{i.value}</span>
                    )}
                  </span>
                </div>
              ))}
            </RevealGroup>

            <Reveal delay={0.15} className="mt-6">
              {get('contact.map_embed') ? (
                <div className="overflow-hidden rounded-lg border border-navy-100">
                  <iframe src={get('contact.map_embed')} title="School location" className="h-72 w-full" loading="lazy" />
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50/50 text-center">
                  <Icon name="pin" size={30} className="text-gold-600" />
                  <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-400">
                    Map placeholder — paste a Google Maps embed URL in <b>Admin → Website Content → Contact & Social</b> to display the school location here.
                  </p>
                </div>
              )}
            </Reveal>
          </div>

          {/* form */}
          <Reveal delay={0.1}>
            <div className="card p-7 md:p-9">
              {sent ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</span>
                  <h3 className="h-display mt-5 text-2xl font-bold text-navy-900">Enquiry received</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Thank you for contacting us. The school office will review your message and respond during working hours.
                  </p>
                  <button className="btn btn-navy mt-6" onClick={() => setSent(false)}>
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="h-display text-2xl font-bold text-navy-900">Send an enquiry</h3>
                  <div className="gold-line mt-3 mb-6" />
                  <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
                    <Input label="Full name" required value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Ahmed Raza" />
                    <Input label="Phone" required value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="03xx-xxxxxxx" />
                    <Input label="Email" required type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" className="sm:col-span-2" />
                    <Input label="Subject" required value={form.subject} onChange={set('subject')} error={errors.subject} placeholder="Admission enquiry for Class 6" className="sm:col-span-2" />
                    <Textarea label="Message" required rows={5} value={form.message} onChange={set('message')} error={errors.message} placeholder="How can we help you?" className="sm:col-span-2" />
                    <div className="sm:col-span-2">
                      <button type="submit" className="btn btn-gold w-full py-4" disabled={busy}>
                        {busy ? 'Sending…' : 'Send Enquiry'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
