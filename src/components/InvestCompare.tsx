import { useId, useMemo } from 'react'
import { BUDGET_PRESETS, formatEgp, type BudgetPresetId } from '../data/partner-offers'
import type { Lang } from '../data'

type SeriesId = 'estate' | 'goldEg' | 'goldUae' | 'funds' | 'thundr'

const SERIES: { id: SeriesId; rate: number; color: string; label: string; labelAr: string }[] = [
  { id: 'estate', rate: 0.22, color: '#f0d48a', label: 'Real estate', labelAr: 'العقار' },
  { id: 'goldEg', rate: 0.11, color: '#e0a15a', label: 'Gold · Egypt', labelAr: 'ذهب · مصر' },
  { id: 'funds', rate: 0.1, color: '#7eb6d6', label: 'Funds', labelAr: 'صناديق' },
  { id: 'thundr', rate: 0.085, color: '#8fd0b0', label: 'Thundr', labelAr: 'ثندر' },
  { id: 'goldUae', rate: 0.07, color: '#c4b49a', label: 'Gold · UAE', labelAr: 'ذهب · الإمارات' },
]

function capitalFor(budgetId: BudgetPresetId, projectPrice: number | null) {
  const preset = BUDGET_PRESETS.find((item) => item.id === budgetId)
  if (!preset || preset.id === 'any') return projectPrice ?? 10_000_000
  if (preset.id === '40plus') return Math.max(projectPrice ?? 0, 60_000_000)
  return preset.max ?? projectPrice ?? 10_000_000
}

function curve(rate: number, years: number, steps: number) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (years * i) / steps
    return Math.pow(1 + rate, t)
  })
}

function toPath(values: number[], width: number, height: number, max: number) {
  const padX = 8
  const padY = 10
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const pts = values.map((v, i) => {
    const x = padX + (innerW * i) / (values.length - 1)
    const y = padY + innerH * (1 - v / max)
    return [x, y] as const
  })
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C ${cx.toFixed(1)} ${y0.toFixed(1)}, ${cx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  return d
}

export function InvestCompare({
  lang,
  budgetId,
  years,
  projectPrice,
  projectName,
}: {
  lang: Lang
  budgetId: BudgetPresetId
  years: number
  projectPrice: number | null
  projectName: string | null
}) {
  const gradId = useId().replace(/:/g, '')
  const stake = capitalFor(budgetId, projectPrice)
  const horizon = Math.max(3, years)
  const steps = 24

  const paths = useMemo(() => {
    const grown = SERIES.map((series) => ({
      ...series,
      multiples: curve(series.rate, horizon, steps),
    }))
    const max = grown[0].multiples[grown[0].multiples.length - 1] * 1.06
    return grown.map((series) => ({
      ...series,
      d: toPath(series.multiples, 640, 220, max),
      end: Math.round(stake * series.multiples[series.multiples.length - 1]),
    }))
  }, [horizon, stake])

  const estate = paths[0]
  const runnerUp = paths.slice(1).reduce((best, item) => (item.end > best.end ? item : best), paths[1])
  const lead = estate.end - runnerUp.end

  return (
    <section className="invest-compare" aria-label={lang === 'ar' ? 'مقارنة الاستثمار' : 'Investment comparison'}>
      <div className="invest-compare-head">
        <p className="partners-deal-kicker">{lang === 'ar' ? 'نفس الميزانية، نتائج مختلفة' : 'Same budget, different curves'}</p>
        <strong>
          {projectName
            ? lang === 'ar'
              ? `${projectName} قدام البدائل`
              : `${projectName} vs the alternatives`
            : lang === 'ar'
              ? 'العقار قدام الذهب والصناديق وثندر'
              : 'Real estate vs gold, funds & Thundr'}
        </strong>
        <p>
          {lang === 'ar'
            ? `مبلغ المقارنة ${formatEgp(stake, 'ar')} على ${horizon} سنين، حسب فلتر الميزانية.`
            : `Compared on ${formatEgp(stake)} over ${horizon} years, following the budget bar.`}
        </p>
      </div>

      <svg className="invest-compare-chart" viewBox="0 0 640 220" role="img">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d48a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f0d48a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="8" x2="632" y1={10 + 200 * g} y2={10 + 200 * g} className="invest-grid" />
        ))}
        <path d={`${estate.d} L 632 210 L 8 210 Z`} fill={`url(#${gradId})`} className="invest-fill" />
        {paths
          .slice()
          .reverse()
          .map((series) => (
            <path
              key={`${series.id}-${stake}-${horizon}`}
              d={series.d}
              fill="none"
              stroke={series.color}
              strokeWidth={series.id === 'estate' ? 3.2 : 1.7}
              strokeLinecap="round"
              pathLength={1}
              className="invest-line"
              style={{ animationDelay: series.id === 'estate' ? '0.05s' : '0.18s' }}
            />
          ))}
      </svg>

      <div className="invest-compare-axis">
        <span>{lang === 'ar' ? 'النهاردة' : 'Today'}</span>
        <span>
          {horizon} {lang === 'ar' ? 'سنين' : 'yrs'}
        </span>
      </div>

      <ul className="invest-compare-legend">
        {paths.map((series) => (
          <li key={series.id}>
            <i style={{ background: series.color }} />
            <span>
              {series.id === 'estate' && projectName
                ? projectName
                : lang === 'ar'
                  ? series.labelAr
                  : series.label}
            </span>
            <b>{formatEgp(series.end, lang)}</b>
          </li>
        ))}
      </ul>

      <p className="invest-compare-lead">
        {lang === 'ar'
          ? `العقار بيتقدم بـ ${formatEgp(lead, 'ar')} عن أقرب بديل في نهاية المدة.`
          : `Real estate finishes ${formatEgp(lead)} ahead of the next-best alternative.`}
      </p>
      <p className="invest-compare-note">
        {lang === 'ar'
          ? 'رسم استرشادي لمقارنة شكل النمو. مش توقع سعر، والأرقام النهائية بتتأكد مع أيمن.'
          : 'Illustrative growth shape for comparison. Not a price forecast — confirm figures with Ayman.'}
      </p>
    </section>
  )
}
