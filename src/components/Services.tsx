import { motion } from 'framer-motion'
import { copy, type Lang } from '../data'

export function Services({ lang }: { lang: Lang }) {
  const t = copy[lang]

  return (
    <section className="section" id="services">
      <div className="section-head">
        <p className="kicker">{t.nav[1]}</p>
        <h2 className="display">{t.servicesTitle}</h2>
        <p>{t.servicesLead}</p>
      </div>
      <div className="services">
        {t.services.map((service, index) => (
          <motion.article
            className="service"
            key={service.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -8 }}
          >
            <span className="idx">0{index + 1}</span>
            <h3 className="display">{service.title}</h3>
            <p>{service.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
