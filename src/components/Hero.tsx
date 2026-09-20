import { motion } from 'framer-motion'
import { asset } from '../assets'
import { CONTACT, copy, type Lang } from '../data'

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
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(16px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: 0.5 }}
      >
        <div className="portrait-morph">
          <div className="gold-ring" />
          <div className="portrait-frame">
            <img src={asset('images/ayman.png')} alt="Ayman Milad, property consultant" />
          </div>
          <motion.div
            className="years-chip"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <b>30</b>
            <span>{lang === 'ar' ? 'سنة' : 'Years'}</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
