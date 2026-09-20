import { useEffect, useMemo, useState } from 'react'
import { CONTACT, type Lang } from '../data'
import {
  BUDGET_PRESETS,
  formatEgp,
  offerFor,
  quotePlan,
  type BudgetPresetId,
  type PaymentPlan,
} from '../data/partner-offers'
import { haptic } from '../haptics'
import { PARTNER_COMPOUNDS } from '../partners'

function whatsappPlan(lang: Lang, compoundName: string, plan: PaymentPlan, quote: ReturnType<typeof quotePlan>) {
  const body =
    lang === 'ar'
      ? `مرحبا أيمن، مهتم بـ ${compoundName}.\nالميزانية حوالي: ${formatEgp(quote.price, 'ar')}\nخطة مقترحة: مقدم ${plan.downPaymentPct}% (${formatEgp(quote.downPayment, 'ar')}) على ${plan.years} سنين.\nالقسط التقريبي: ${formatEgp(quote.installment, 'ar')} / ${plan.cadence === 'quarterly' ? 'ربع سنة' : 'شهر'}.\nعايز أحدث الأسعار والخطة.`
      : `Hello Ayman, interested in ${compoundName}.\nBudget around: ${formatEgp(quote.price)}\nSuggested plan: ${plan.downPaymentPct}% down (${formatEgp(quote.downPayment)}) over ${plan.years} years.\nApprox installment: ${formatEgp(quote.installment)} / ${plan.cadence === 'quarterly' ? 'quarter' : 'month'}.\nPlease share the latest price & plan.`
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

  useEffect(() => {
    setPlanIndex(0)
  }, [selected])

  const plan = offer?.plans[Math.min(planIndex, (offer.plans.length || 1) - 1)] ?? null
  const quote = useMemo(() => {
    if (!offer || !plan) return null
    return quotePlan(offer.priceFrom, plan)
  }, [offer, plan])

  const name = compound ? (lang === 'ar' ? compound.nameAr : compound.name) : null

  return (
    <aside className="partners-deal" aria-label={lang === 'ar' ? 'الميزانية وخطة السداد' : 'Budget & payment plan'}>
      <div className="partners-budget">
        <p className="partners-deal-kicker">{lang === 'ar' ? 'فلتر الميزانية' : 'Budget filter'}</p>
        <div className="partners-budget-rail" role="group">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={budgetId === preset.id ? 'is-on' : undefined}
              onClick={() => {
                haptic('light')
                onBudget(preset.id)
              }}
            >
              {lang === 'ar' ? preset.labelAr : preset.label}
            </button>
          ))}
        </div>
      </div>

      {offer && plan && quote && name ? (
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
                  {item.downPaymentPct}% / {item.years}y
                </button>
              ))}
            </div>
          ) : null}

          <dl className="partners-plan-grid">
            <div>
              <dt>{lang === 'ar' ? 'المقدم' : 'Down payment'}</dt>
              <dd>
                {plan.downPaymentPct}% · {formatEgp(quote.downPayment, lang)}
              </dd>
            </div>
            <div>
              <dt>{lang === 'ar' ? 'القسط' : 'Installment'}</dt>
              <dd>
                {formatEgp(quote.installment, lang)}
                <small> / {plan.cadence === 'quarterly' ? (lang === 'ar' ? 'ربع سنة' : 'quarter') : lang === 'ar' ? 'شهر' : 'mo'}</small>
              </dd>
            </div>
            <div>
              <dt>{lang === 'ar' ? 'المدة' : 'Term'}</dt>
              <dd>
                {plan.years} {lang === 'ar' ? 'سنين' : 'years'} · {quote.payments}{' '}
                {lang === 'ar' ? 'دفعة' : 'payments'}
              </dd>
            </div>
            <div>
              <dt>{lang === 'ar' ? 'الممول' : 'Financed'}</dt>
              <dd>{formatEgp(quote.financed, lang)}</dd>
            </div>
          </dl>

          {plan.note || plan.noteAr ? (
            <p className="partners-plan-note">{lang === 'ar' ? plan.noteAr ?? plan.note : plan.note}</p>
          ) : null}

          <p className="partners-plan-source">
            {lang === 'ar' ? 'مصادر عامة:' : 'Public sources:'}{' '}
            {offer.sources.map((source, index) => (
              <span key={source.url}>
                {index ? ' · ' : null}
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
              </span>
            ))}
            <span>
              {' '}
              · {lang === 'ar' ? 'أكد الرقم الحالي مع أيمن' : 'confirm live quote with Ayman'}
            </span>
          </p>

          <a
            className="btn btn-gold partners-plan-cta"
            href={whatsappPlan(lang, name, plan, quote)}
            target="_blank"
            rel="noreferrer"
            onClick={() => haptic('success')}
          >
            {lang === 'ar' ? 'اسأل أيمن عن الخطة' : 'Ask Ayman about this plan'}
          </a>
        </div>
      ) : (
        <p className="partners-plan-empty">
          {lang === 'ar'
            ? 'اختار كمباوند على الخريطة عشان تشوف السعر التقديري وخطة السداد.'
            : 'Pick a compound on the map to see indicative pricing and a payment plan.'}
        </p>
      )}
    </aside>
  )
}
