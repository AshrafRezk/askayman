import { motion } from 'framer-motion'
import { useState } from 'react'
import { asset } from '../assets'
import { copy, type Lang } from '../data'
import { DESTINATIONS, NAWY, type DestinationId } from '../destinations'

export function About({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [active, setActive] = useState<DestinationId>('egypt')
  const country = DESTINATIONS.find((item) => item.id === active) ?? DESTINATIONS[0]

  return (
    <section className="section" id="about">
      <div className="stats">
        {t.stats.map((stat, index) => (
          <motion.article
            className="stat"
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.08 }}
          >
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </motion.article>
        ))}
      </div>

      <div className="about-grid" style={{ marginTop: 28 }}>
        <motion.div
          className="about-copy"
          initial={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="kicker">{t.nav[0]}</p>
          <h2 className="display">{t.aboutTitle}</h2>
          <p>{t.aboutBody}</p>
          <ul className="points">
            {t.aboutPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="destinations-panel">
            <p className="destinations-title">{t.destinationsTitle}</p>
            <p className="destinations-lead">{t.destinationsLead}</p>
            <div className="destination-tabs" role="tablist" aria-label={t.destinationsTitle}>
              {DESTINATIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === item.id}
                  className={active === item.id ? 'is-on' : undefined}
                  onClick={() => setActive(item.id)}
                >
                  {lang === 'ar' ? item.nameAr : item.name}
                </button>
              ))}
            </div>
            <div className="destination-panel-body" role="tabpanel">
              {country.subs?.length ? (
                <div className="destination-subs" role="list">
                  {country.subs.map((sub) => (
                    <div key={sub.id} className="destination-sub" role="listitem">
                      <span>{lang === 'ar' ? sub.nameAr : sub.name}</span>
                      {sub.note || sub.noteAr ? (
                        <small>{lang === 'ar' ? sub.noteAr : sub.note}</small>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="destination-hint">{lang === 'ar' ? country.hintAr : country.hint}</p>
              )}
            </div>
          </div>

          <a className="nawy-partner" href={NAWY.href} target="_blank" rel="noreferrer">
            <img src={asset(NAWY.logo)} alt="Nawy" />
            <span>
              <strong>{t.nawyPartnerTitle}</strong>
              <em>{t.nawyPartnerText}</em>
            </span>
          </a>
        </motion.div>
        <motion.div
          className="about-panel"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(6, 16, 28, 0.1), rgba(6, 16, 28, 0.55)), url('${asset('images/cover.png')}')` }}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        />
      </div>
    </section>
  )
}
