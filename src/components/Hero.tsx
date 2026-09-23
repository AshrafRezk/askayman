import { motion } from 'framer-motion'
import { asset } from '../assets'
import { CONTACT, copy, type Lang } from '../data'
import { DESTINATIONS } from '../destinations'

export function Hero({ lang }: { lang: Lang }) {
  const t = copy[lang]

  return (
    <section className="hero" id="top">
      <div>
        <motion.p
          className="kicker"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {t.kicker}
        </motion.p>
        <motion.h1
          className="display"
          initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 0.65 }}
        >
          {t.headline}
        </motion.h1>
        <motion.h2
          className="display"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {t.subhead}
        </motion.h2>
        <motion.p
          className="lead"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          {t.lead}
        </motion.p>
        <motion.div
          className="hero-destinations"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          aria-label={t.destinationsLabel}
        >
          <span className="hero-destinations-label">{t.destinationsLabel}</span>
          <div className="destination-chips">
            {DESTINATIONS.map((country) => (
              <a key={country.id} className="destination-chip" href="#about">
                {lang === 'ar' ? country.nameAr : country.name}
              </a>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="cta-row"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
        >
          <a className="btn btn-gold" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
            {t.ctaAsk}
          </a>
          <a className="btn btn-ghost" href={`tel:${CONTACT.phoneTel}`}>
            {t.ctaCall} · <span dir="ltr">{CONTACT.phoneDisplay}</span>
          </a>
        </motion.div>
      </div>
      <motion.div
        className="portrait-wrap"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
      >
        <div className="portrait-morph">
          <div className="gold-ring" aria-hidden="true" />
          <div className="portrait-frame">
            <img src={asset('images/ask-ayman.png')} alt="Ayman Milad" />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
