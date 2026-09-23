import { useEffect, useMemo, useState } from 'react'
import { CONTACT, type Lang } from '../data'
import {
  BUDGET_PRESETS,
  MARKET_EQUALIZATION_APR,
  formatEgp,
  offerFor,
  quoteCustomPlan,
  type BudgetPresetId,
  type PlanLoading,
  type PlanQuote,
} from '../data/partner-offers'
import { haptic } from '../haptics'
import { PARTNER_COMPOUNDS } from '../partners'
import { InvestCompare } from './InvestCompare'

const YEAR_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 12]
const DP_OPTIONS = [0, 1.5, 5, 10, 15, 20, 25, 30, 40]
const LOADING_OPTIONS: { id: PlanLoading; label: string; labelAr: string }[] = [
  { id: 'equal', label: 'Equal', labelAr: 'متساوي' },
  { id: 'front', label: 'Front-loaded', labelAr: 'مقدم أثقل' },
  { id: 'back', label: 'Back-loaded', labelAr: 'تصاعدي' },
]

function loadingLabel(lang: Lang, loading: PlanLoading) {
  const item = LOADING_OPTIONS.find((option) => option.id === loading)
  return lang === 'ar' ? item?.labelAr : item?.label
}

function whatsappPlan(lang: Lang, compoundName: string, quote: PlanQuote) {
  const cadence = quote.cadence === 'quarterly' ? (lang === 'ar' ? 'ربع سنة' : 'quarter') : lang === 'ar' ? 'شهر' : 'mo'
  const load = loadingLabel(lang, quote.loading)
  const body =
    lang === 'ar'
      ? `مرحبا أيمن، مهتم بـ ${compoundName}.\nالسعر الاسترشادي: ${formatEgp(quote.price, 'ar')}\nخطتي: مقدم ${quote.downPaymentPct}% (${formatEgp(quote.downPayment, 'ar')}) على ${quote.years} سنين · ${load}.\nالقسط التقريبي: ${formatEgp(quote.installment, 'ar')} / ${cadence}${quote.installmentLast !== quote.installment ? ` (آخر قسط ${formatEgp(quote.installmentLast, 'ar')})` : ''}.\nفائدة السوق التقريبية ${(quote.apr * 100).toFixed(0)}٪ · إجمالي تقريبي ${formatEgp(quote.totalPaid, 'ar')}.\nعايز أحدث الأسعار والخطة.`
      : `Hello Ayman, interested in ${compoundName}.\nIndicative price: ${formatEgp(quote.price)}\nMy plan: ${quote.downPaymentPct}% down (${formatEgp(quote.downPayment)}) over ${quote.years} years · ${load}.\nApprox installment: ${formatEgp(quote.installment)} / ${cadence}${quote.installmentLast !== quote.installment ? ` (last ${formatEgp(quote.installmentLast)})` : ''}.\nMarket equalization ~${(quote.apr * 100).toFixed(0)}% · total ~${formatEgp(quote.totalPaid)}.\nPlease share the latest price & plan.`
  return `${CONTACT.whatsapp}?text=${encodeURIComponent(body)}`
}

export function BudgetDealPanel({
  lang,
  selected,
  budgetId,
  onBudget,
}: {
  lang: Lang
  selected: string | null
  budgetId: BudgetPresetId
  onBudget: (id: BudgetPresetId) => void
}) {
  const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected) ?? null
  const offer = selected ? offerFor(selected) : null
  const [planIndex, setPlanIndex] = useState(0)
  const [years, setYears] = useState(8)
  const [downPaymentPct, setDownPaymentPct] = useState(5)
  const [loading, setLoading] = useState<PlanLoading>('equal')

  const preset = offer?.plans[Math.min(planIndex, (offer.plans.length || 1) - 1)] ?? null

  useEffect(() => {
    setPlanIndex(0)
  }, [selected])

  useEffect(() => {
    if (!preset) return
    setYears(preset.years)
    setDownPaymentPct(preset.downPaymentPct)
    setLoading('equal')
  }, [selected, planIndex, preset?.years, preset?.downPaymentPct])

  const quote = useMemo(() => {
    if (!offer || !preset) return null
    return quoteCustomPlan(offer.priceFrom, {
      downPaymentPct,
      years,
      cadence: preset.cadence,
      loading,
      apr: MARKET_EQUALIZATION_APR,
    })
  }, [offer, preset, downPaymentPct, years, loading])

  const name = compound ? (lang === 'ar' ? compound.nameAr : compound.name) : null
  const cadenceLabel =
    preset?.cadence === 'quarterly'
      ? lang === 'ar'
        ? 'ربع سنة'
        : 'quarter'
      : lang === 'ar'
        ? 'شهر'
        : 'mo'
  const aprPct = Math.round(MARKET_EQUALIZATION_APR * 100)

  return (
    <aside className="partners-deal" aria-label={lang === 'ar' ? 'الميزانية وخطة السداد' : 'Budget & payment plan'}>
      <div className="partners-budget">
        <p className="partners-deal-kicker">{lang === 'ar' ? 'فلتر الميزانية' : 'Budget filter'}</p>
        <div className="partners-budget-rail" role="group">
          {BUDGET_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={budgetId === item.id ? 'is-on' : undefined}
              onClick={() => {
                haptic('light')
                onBudget(item.id)
              }}
            >
              {lang === 'ar' ? item.labelAr : item.label}
            </button>
          ))}
        </div>
      </div>

      {offer && preset && quote && name ? (
        <div className="partners-plan">
          <div className="partners-plan-head">
            <div>
              <p className="partners-deal-kicker">{lang === 'ar' ? 'محرك خطة السداد' : 'Payment plan engine'}</p>
              <strong>{name}</strong>
            </div>
            <span className={`partners-avail is-${offer.availability}`}>
              {offer.availability === 'primary'
                ? lang === 'ar'
                  ? 'أساسي'
                  : 'Primary'
                : offer.availability === 'resale'
                  ? lang === 'ar'
                    ? 'ريسيل'
                    : 'Resale'
                  : lang === 'ar'
                    ? 'مباع'
                    : 'Sold'}
            </span>
          </div>

          <p className="partners-plan-price">
            {lang === 'ar' ? 'يبدأ من' : 'From'} <b>{formatEgp(offer.priceFrom, lang)}</b>
            {offer.priceTo ? (
              <span>
                {' '}
                · {lang === 'ar' ? 'حتى' : 'up to'} {formatEgp(offer.priceTo, lang)}
              </span>
            ) : null}
          </p>
          <p className="partners-plan-hint">{lang === 'ar' ? offer.unitHintAr : offer.unitHint}</p>

          {offer.plans.length > 1 ? (
            <div className="partners-plan-tabs" role="tablist">
              {offer.plans.map((item, index) => (
                <button
                  key={`${item.downPaymentPct}-${item.years}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={index === planIndex}
                  className={index === planIndex ? 'is-on' : undefined}
                  onClick={() => {
                    haptic('light')
                    setPlanIndex(index)
                  }}
                >
                  {lang === 'ar' ? 'عرض المطوّر' : 'Developer'} {item.downPaymentPct}% / {item.years}y
                </button>
              ))}
            </div>
          ) : null}

          <div className="partners-plan-controls">
            <label className="partners-plan-field">
              <span>{lang === 'ar' ? 'المدة (سنين)' : 'Years desired'}</span>
              <div className="partners-plan-chips" role="group">
                {YEAR_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={years === value ? 'is-on' : undefined}
                    onClick={() => {
                      haptic('light')
                      setYears(value)
                    }}
                  >
                    {value}y
                  </button>
                ))}
              </div>
            </label>

            <label className="partners-plan-field">
              <span>{lang === 'ar' ? 'المقدم المطلوب' : 'Down payment desired'}</span>
              <div className="partners-plan-chips" role="group">
                {DP_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={downPaymentPct === value ? 'is-on' : undefined}
                    onClick={() => {
                      haptic('light')
                      setDownPaymentPct(value)
                    }}
                  >
                    {Number.isInteger(value) ? value : value.toFixed(1)}%
                  </button>
                ))}
              </div>
            </label>

            <label className="partners-plan-field">
              <span>{lang === 'ar' ? 'شكل الأقساط' : 'Payment loading'}</span>
              <div className="partners-plan-chips" role="group">
                {LOADING_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={loading === option.id ? 'is-on' : undefined}
                    onClick={() => {
                      haptic('light')
                      setLoading(option.id)
                    }}
                  >
                    {lang === 'ar' ? option.labelAr : option.label}
                  </button>
                ))}
              </div>
            </label>

            <p className="partners-plan-rate">
              {lang === 'ar'
                ? `فائدة التعادل السوقية ≈ ${aprPct}٪ سنوياً (استرشادي للمطوّرين)`
                : `Market equalization ≈ ${aprPct}% APR (indicative developer band)`}
            </p>
          </div>

          <dl className="partners-plan-grid">
            <div>
              <dt>{lang === 'ar' ? 'المقدم' : 'Down payment'}</dt>
              <dd>
                {quote.downPaymentPct}% · {formatEgp(quote.downPayment, lang)}
              </dd>
            </div>
            <div>
              <dt>
                {loading === 'equal'
                  ? lang === 'ar'
                    ? 'القسط'
                    : 'Installment'
                  : lang === 'ar'
                    ? 'أول قسط'
                    : 'First installment'}
              </dt>
              <dd>
                {formatEgp(quote.installment, lang)}
                <small> / {cadenceLabel}</small>
              </dd>
            </div>
            {loading !== 'equal' ? (
              <div>
                <dt>{lang === 'ar' ? 'آخر قسط' : 'Last installment'}</dt>
                <dd>
                  {formatEgp(quote.installmentLast, lang)}
                  <small> / {cadenceLabel}</small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>{lang === 'ar' ? 'المدة' : 'Term'}</dt>
              <dd>
                {quote.years} {lang === 'ar' ? 'سنين' : 'years'} · {quote.payments}{' '}
                {lang === 'ar' ? 'دفعة' : 'payments'}
              </dd>
            </div>
            <div>
              <dt>{lang === 'ar' ? 'التعادل / الفائدة' : 'Equalization'}</dt>
              <dd>
                {formatEgp(quote.interest, lang)}
                <small> · {aprPct}%</small>
              </dd>
            </div>
            <div>
              <dt>{lang === 'ar' ? 'الإجمالي التقريبي' : 'Total paid'}</dt>
              <dd>{formatEgp(quote.totalPaid, lang)}</dd>
            </div>
          </dl>

          <InvestCompare
            lang={lang}
            budgetId={budgetId}
            years={quote.years}
            projectPrice={offer.priceFrom}
            projectName={name}
          />

          {preset.note || preset.noteAr ? (
            <p className="partners-plan-note">{lang === 'ar' ? preset.noteAr ?? preset.note : preset.note}</p>
          ) : null}

          <p className="partners-plan-source">
            {lang === 'ar' ? 'مصادر عامة:' : 'Public sources:'}{' '}
            {offer.sources.map((source, index) => (
              <span key={source.url}>
                {index ? ' · ' : null}
                {/nawy\.com/i.test(source.url) ? (
                  source.name
                ) : (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.name}
                  </a>
                )}
              </span>
            ))}
            <span>
              {' '}
              · {lang === 'ar' ? 'أكد الرقم الحالي مع أيمن' : 'confirm live quote with Ayman'}
            </span>
          </p>

          <a
            className="btn btn-gold partners-plan-cta"
            href={whatsappPlan(lang, name, quote)}
            target="_blank"
            rel="noreferrer"
            onClick={() => haptic('success')}
          >
            {lang === 'ar' ? 'اسأل أيمن عن الخطة' : 'Ask Ayman about this plan'}
          </a>
        </div>
      ) : (
        <>
          <InvestCompare lang={lang} budgetId={budgetId} years={8} projectPrice={null} projectName={null} />
          <p className="partners-plan-empty">
            {lang === 'ar'
              ? 'اختار كمباوند على الخريطة عشان المنحنى الذهبي يبقى باسم المشروع وخطة السداد.'
              : 'Pick a compound on the map so the gold curve takes the project name and the payment plan.'}
          </p>
        </>
      )}
    </aside>
  )
}
