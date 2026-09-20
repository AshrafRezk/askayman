import { motion } from 'framer-motion'
import { asset } from '../assets'
import { copy, type Lang } from '../data'

export function Insights({ lang }: { lang: Lang }) {
  const t = copy[lang]

  return (
    <section className="section" id="insights">
      <div className="section-head">
        <p className="kicker">{t.nav[2]}</p>
        <h2 className="display">{t.insightsTitle}</h2>
        <p>{t.insightsLead}</p>
      </div>
      <div className="insights">
        {t.insights.map((item, index) => (
          <motion.a
            className="insight"
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <img src={asset(item.image)} alt={item.title} />
            <div className="shade">
              <h3 className="display">{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
