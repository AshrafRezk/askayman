import { motion } from 'framer-motion'
import { copy, type Lang } from '../data'

export function About({ lang }: { lang: Lang }) {
  const t = copy[lang]

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
        </motion.div>
        <motion.div
          className="about-panel"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        />
      </div>
    </section>
  )
}
