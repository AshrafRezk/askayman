import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CONTACT, copy, type Lang } from '../data'
import { haptic } from '../haptics'
import { BrandMap } from './BrandMap'
import { SocialLinks } from './SocialIcons'

export function Contact({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [intent, setIntent] = useState(t.intents[0])
  const [message, setMessage] = useState('')

  useEffect(() => {
    setIntent(copy[lang].intents[0])
  }, [lang])

  const href = useMemo(() => {
    const body =
      lang === 'ar'
        ? `مرحبا أيمن، أنا ${name || 'عميل جديد'}.\nعايز: ${intent}\nموبايل: ${phone}\n${message}`
        : `Hello Ayman, this is ${name || 'a new client'}.\nI want to: ${intent}\nPhone: ${phone}\n${message}`
    return `${CONTACT.whatsapp}?text=${encodeURIComponent(body)}`
  }, [intent, lang, message, name, phone])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    haptic('success')
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="section" id="contact">
      <div className="section-head">
        <p className="kicker">{t.nav[3]}</p>
        <h2 className="display">{t.contactTitle}</h2>
        <p>{t.contactLead}</p>
      </div>
      <div className="contact-grid">
        <form className="form" onSubmit={onSubmit}>
          <h3 className="display">{t.ctaAsk}</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.formName} required />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.formPhone} required />
          <select value={intent} onChange={(e) => setIntent(e.target.value)}>
            {t.intents.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.formMessage}
          />
          <button className="btn btn-gold" type="submit">
            {t.formSubmit}
          </button>
        </form>
        <article className="contact-card">
          <h3 className="display">{t.visit}</h3>
          <p>{lang === 'ar' ? CONTACT.addressAr : CONTACT.addressEn}</p>
          <div className="meta">
            <a href={`tel:${CONTACT.phoneTel}`}>{CONTACT.phoneDisplay}</a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <SocialLinks />
          </div>
          <BrandMap lang={lang} />
        </article>
      </div>
    </section>
  )
}
