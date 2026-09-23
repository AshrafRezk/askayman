import { motion } from 'framer-motion'
import { copy, type Lang } from '../data'

export function Reviews({ lang }: { lang: Lang }) {
  const t = copy[lang]

  return (
    <section className="section page-view" id="reviews">
      <p className="kicker">{t.nav[5]}</p>
      <h1 className="display page-title">{t.reviewsTitle}</h1>
      <p className="page-lead">{t.reviewsLead}</p>
      <div className="review-grid">
        {t.reviews.map((review, index) => (
          <motion.blockquote
            className="review-card"
            key={review.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <p>{review.text}</p>
            <footer>
              <strong>{review.name}</strong>
              <span>{review.place}</span>
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  )
}
