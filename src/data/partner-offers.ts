/** Indicative developer / portal offers (EGP). Not live quotes — confirm with Ayman. */

export type PaymentPlan = {
  downPaymentPct: number
  years: number
  cadence: 'monthly' | 'quarterly'
  note?: string
  noteAr?: string
}

export type PartnerOffer = {
  partnerId: string
  /** Lowest publicly listed starting price in EGP. */
  priceFrom: number
  /** Optional upper band for filter matching. */
  priceTo?: number
  unitHint: string
  unitHintAr: string
  plans: PaymentPlan[]
  availability: 'primary' | 'resale' | 'sold'
  sources: { name: string; url: string }[]
  updated: string
}

export const PARTNER_OFFERS: PartnerOffer[] = [
  {
    partnerId: 'sodic-east',
    priceFrom: 13_256_000,
    priceTo: 28_028_000,
    unitHint: 'Apartments from · villas higher',
    unitHintAr: 'شقق من · فيلات أعلى',
    plans: [
      { downPaymentPct: 5, years: 10, cadence: 'monthly', note: 'Escalating options on Nawy', noteAr: 'أنظمة تصاعدية على نawy' },
      { downPaymentPct: 1.5, years: 10, cadence: 'monthly', note: 'Low-entry plan', noteAr: 'خطة مقدم منخفض' },
    ],
    availability: 'primary',
    sources: [
      { name: 'Nawy', url: 'https://www.nawy.com/compound/176-sodic-east' },
      { name: 'RealEstate Egy', url: 'https://realestate-egy.com/developers/sodic/' },
    ],
    updated: '2026-09',
  },
  {
    partnerId: 'villette',
    priceFrom: 22_000_000,
    priceTo: 54_600_000,
    unitHint: 'V-Residence · villas · duplexes',
    unitHintAr: 'في ريزيدنس · فيلات · دوبلكس',
    plans: [
      {
        downPaymentPct: 5,
        years: 8,
        cadence: 'quarterly',
        note: '5% + staged early payments, then quarterly',
        noteAr: 'مقدم ٥٪ + دفعات مبكرة ثم ربع سنوي',
      },
    ],
    availability: 'primary',
    sources: [{ name: 'Dee Properties', url: 'https://www.deeproperties.com/en/projects/villette-new-cairo/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'eastown',
    priceFrom: 16_000_000,
    priceTo: 45_000_000,
    unitHint: 'Apartments · penthouses · villas',
    unitHintAr: 'شقق · بنتهاوس · فيلات',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'CompoundGate', url: 'https://compoundgate.com/en/new-cairo/eastown-residence' }],
    updated: '2026-08',
  },
  {
    partnerId: 'june',
    priceFrom: 18_740_000,
    priceTo: 38_010_000,
    unitHint: 'Aqua chalets · Opal villas from 102 m²',
    unitHintAr: 'شاليهات أكوا · فيلات أوبال من ١٠٢ م²',
    plans: [{ downPaymentPct: 3, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'SODIC', url: 'https://sodic.my.site.com/SodicProject/JUNE' }],
    updated: '2026-09',
  },
  {
    partnerId: 'caesar',
    priceFrom: 37_000_000,
    priceTo: 55_000_000,
    unitHint: 'North Coast · Caesar extension',
    unitHintAr: 'الساحل · امتداد سيزر',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'RealEstate Egy', url: 'https://realestate-egy.com/developers/sodic/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'ogami',
    priceFrom: 21_465_000,
    priceTo: 27_699_000,
    unitHint: 'Ras El Hekma · Bloom Island phases',
    unitHintAr: 'رأس الحكمة · بلوم آيلاند',
    plans: [{ downPaymentPct: 10, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [
      { name: 'Nawy', url: 'https://www.nawy.com/' },
      { name: 'RealEstate Egy', url: 'https://realestate-egy.com/developers/sodic/' },
    ],
    updated: '2026-09',
  },
  {
    partnerId: 'karmell',
    priceFrom: 12_000_000,
    priceTo: 35_000_000,
    unitHint: 'West Cairo · indicative band',
    unitHintAr: 'غرب القاهرة · نطاق استرشادي',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'SODIC portfolio', url: 'https://www.sodic.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'the-estates',
    priceFrom: 25_000_000,
    priceTo: 60_000_000,
    unitHint: 'West Cairo estates · indicative',
    unitHintAr: 'ذا إستيتس · استرشادي',
    plans: [{ downPaymentPct: 10, years: 6, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'SODIC portfolio', url: 'https://www.sodic.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'sodic-west',
    priceFrom: 9_361_000,
    priceTo: 40_000_000,
    unitHint: 'Westown corridor · from SODIC west bank',
    unitHintAr: 'محور ويستاون · من محفظة سوديك غرب',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'RealEstate Egy', url: 'https://realestate-egy.com/developers/sodic/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'october-plaza',
    priceFrom: 8_500_000,
    priceTo: 18_000_000,
    unitHint: '6th of October · landmark / resale heavy',
    unitHintAr: '٦ أكتوبر · معلم / ريسيل غالب',
    plans: [{ downPaymentPct: 10, years: 5, cadence: 'monthly', note: 'Often resale terms', noteAr: 'غالباً شروط ريسيل' }],
    availability: 'resale',
    sources: [{ name: 'SODIC', url: 'https://www.sodic.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'kattameya-plaza',
    priceFrom: 7_500_000,
    priceTo: 20_000_000,
    unitHint: 'New Cairo plaza · mostly resale',
    unitHintAr: 'قطامية بلازا · غالباً ريسيل',
    plans: [{ downPaymentPct: 20, years: 3, cadence: 'monthly', note: 'Seller terms vary', noteAr: 'شروط البائع بتختلف' }],
    availability: 'resale',
    sources: [{ name: 'Market listings', url: 'https://www.nawy.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-city',
    priceFrom: 3_945_900,
    priceTo: 17_000_000,
    unitHint: 'Apartments from · villas higher',
    unitHintAr: 'شقق من · فيلات أعلى',
    plans: [
      { downPaymentPct: 5, years: 10, cadence: 'monthly' },
      { downPaymentPct: 0, years: 12, cadence: 'monthly', note: 'Select launches', noteAr: 'إطلاقات مختارة' },
    ],
    availability: 'primary',
    sources: [
      { name: 'CompoundGate', url: 'https://compoundgate.com/en/new-cairo/taj-city' },
      { name: 'Step One Elite', url: 'https://steponeelite.com/en/compounds/taj-city/' },
    ],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-tzone',
    priceFrom: 4_500_000,
    priceTo: 12_000_000,
    unitHint: 'Immediate handover · 20% / 7y typical',
    unitHintAr: 'استلام فوري · غالباً ٢٠٪ / ٧ سنين',
    plans: [{ downPaymentPct: 20, years: 7, cadence: 'monthly', note: 'Zone T system', noteAr: 'نظام زون تي' }],
    availability: 'primary',
    sources: [
      { name: 'Taj City', url: 'https://www.taj-city.net/en/taj-city-t-zone' },
      { name: 'GPR', url: 'https://gprproperty.com/en/project/taj-city-new-cairo/' },
    ],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-kinda',
    priceFrom: 4_207_640,
    priceTo: 31_104_693,
    unitHint: 'Office / commercial & residential stock',
    unitHintAr: 'مكاتب وتجاري وسكني',
    plans: [
      { downPaymentPct: 5, years: 8, cadence: 'monthly' },
      { downPaymentPct: 10, years: 8, cadence: 'monthly', note: 'Kinda system', noteAr: 'نظام كيندا' },
    ],
    availability: 'primary',
    sources: [
      { name: 'Taj City', url: 'https://www.taj-city.net/en/kinda-taj-city' },
      { name: 'Step One Elite', url: 'https://steponeelite.com/en/compounds/taj-city/' },
    ],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-clubside',
    priceFrom: 5_500_000,
    priceTo: 14_000_000,
    unitHint: 'Apartments from ~80 m² · sold-out phases + resale',
    unitHintAr: 'شقق من ~٨٠ م² · مراحل مباعة + ريسيل',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'resale',
    sources: [{ name: 'CompoundGate', url: 'https://compoundgate.com/en/new-cairo/taj-city' }],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-shalya',
    priceFrom: 6_000_000,
    priceTo: 15_000_000,
    unitHint: 'Sold out · ask Ayman for resale',
    unitHintAr: 'مباع · اسأل أيمن عن الريسيل',
    plans: [{ downPaymentPct: 25, years: 3, cadence: 'monthly', note: 'Resale terms', noteAr: 'شروط ريسيل' }],
    availability: 'sold',
    sources: [{ name: 'Madinet Masr', url: 'https://www.madinetmasr.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'taj-sultan',
    priceFrom: 7_000_000,
    priceTo: 18_000_000,
    unitHint: 'Sold out · park-side resale',
    unitHintAr: 'مباع · ريسيل على الحديقة',
    plans: [{ downPaymentPct: 25, years: 3, cadence: 'monthly', note: 'Resale terms', noteAr: 'شروط ريسيل' }],
    availability: 'sold',
    sources: [{ name: 'Madinet Masr', url: 'https://www.madinetmasr.com/' }],
    updated: '2026-09',
  },
  {
    partnerId: 'sarai',
    priceFrom: 5_500_000,
    priceTo: 22_000_000,
    unitHint: 'Mostakbal City · beside Madinaty',
    unitHintAr: 'مدينة المستقبل · جنب مدينتي',
    plans: [{ downPaymentPct: 5, years: 8, cadence: 'monthly' }],
    availability: 'primary',
    sources: [{ name: 'Market listings', url: 'https://www.nawy.com/' }],
    updated: '2026-09',
  },
]

export const BUDGET_PRESETS = [
  { id: 'any', max: null as number | null, label: 'Any budget', labelAr: 'أي ميزانية' },
  { id: '5', max: 5_000_000, label: 'Under 5M', labelAr: 'أقل من ٥ مليون' },
  { id: '10', max: 10_000_000, label: 'Under 10M', labelAr: 'أقل من ١٠ مليون' },
  { id: '20', max: 20_000_000, label: 'Under 20M', labelAr: 'أقل من ٢٠ مليون' },
  { id: '40', max: 40_000_000, label: 'Under 40M', labelAr: 'أقل من ٤٠ مليون' },
  { id: '40plus', max: null as number | null, min: 40_000_000, label: '40M+', labelAr: '٤٠ مليون+' },
] as const

export type BudgetPresetId = (typeof BUDGET_PRESETS)[number]['id']

export function offerFor(partnerId: string) {
  return PARTNER_OFFERS.find((item) => item.partnerId === partnerId) ?? null
}

export function offerMatchesBudget(offer: PartnerOffer, maxBudget: number | null, minBudget = 0) {
  if (maxBudget == null && minBudget <= 0) return true
  const from = offer.priceFrom
  const to = offer.priceTo ?? offer.priceFrom
  const ceiling = maxBudget ?? Number.POSITIVE_INFINITY
  return from <= ceiling && to >= minBudget
}

export function formatEgp(value: number, lang: 'en' | 'ar' = 'en') {
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10
    return lang === 'ar' ? `${rounded} مليون ج.م` : `${rounded}M EGP`
  }
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Egypt off-plan equalization band used when customizing beyond flat 0% schedules. */
export const MARKET_EQUALIZATION_APR = 0.12

export type PlanLoading = 'equal' | 'front' | 'back'

export type CustomPlanInput = {
  downPaymentPct: number
  years: number
  cadence: PaymentPlan['cadence']
  loading: PlanLoading
  /** Annual rate; defaults to market equalization. */
  apr?: number
}

export type PlanQuote = {
  price: number
  downPayment: number
  financed: number
  /** First / level installment (what buyers usually ask for). */
  installment: number
  /** Last installment when schedule is weighted. */
  installmentLast: number
  payments: number
  cadence: PaymentPlan['cadence']
  years: number
  downPaymentPct: number
  loading: PlanLoading
  apr: number
  totalPaid: number
  interest: number
}

export function quotePlan(price: number, plan: PaymentPlan): PlanQuote {
  return quoteCustomPlan(price, {
    downPaymentPct: plan.downPaymentPct,
    years: plan.years,
    cadence: plan.cadence,
    loading: 'equal',
    apr: 0,
  })
}

function amortizeEqual(principal: number, ratePerPeriod: number, n: number) {
  if (n <= 0) return 0
  if (ratePerPeriod <= 0) return principal / n
  const growth = Math.pow(1 + ratePerPeriod, n)
  return (principal * ratePerPeriod * growth) / (growth - 1)
}

/** Build positive weights that sum to 1 for front / equal / back schedules. */
function scheduleWeights(n: number, loading: PlanLoading) {
  if (n <= 1) return [1]
  if (loading === 'equal') return Array.from({ length: n }, () => 1 / n)

  // Front: heavier early cheques (~55% of the curve in the first half).
  // Back / تصاعدي: ~8% step-up across the term (common Egypt escalating shape).
  const shaped =
    loading === 'front'
      ? Array.from({ length: n }, (_, i) => 1.55 - (i / (n - 1)) * 1.1)
      : Array.from({ length: n }, (_, i) => Math.pow(1.08, (i / (n - 1)) * Math.max(1, n / 12)))

  const sum = shaped.reduce((a, b) => a + b, 0)
  return shaped.map((w) => w / sum)
}

function scheduleAmounts(total: number, weights: number[]) {
  const amounts = weights.map((w) => Math.round(total * w))
  const drift = Math.round(total) - amounts.reduce((a, b) => a + b, 0)
  amounts[amounts.length - 1] += drift
  return amounts
}

export function quoteCustomPlan(price: number, input: CustomPlanInput): PlanQuote {
  const downPaymentPct = Math.min(90, Math.max(0, input.downPaymentPct))
  const years = Math.min(15, Math.max(1, input.years))
  const cadence = input.cadence
  const loading = input.loading
  const apr = Math.max(0, input.apr ?? MARKET_EQUALIZATION_APR)

  const downPayment = Math.round((price * downPaymentPct) / 100)
  const financed = Math.max(0, price - downPayment)
  const perYear = cadence === 'quarterly' ? 4 : 12
  const payments = Math.max(1, Math.round(years * perYear))
  const ratePerPeriod = apr / perYear

  const equalPmt = amortizeEqual(financed, ratePerPeriod, payments)
  const equalTotal = equalPmt * payments
  const amounts =
    loading === 'equal'
      ? Array.from({ length: payments }, () => Math.round(equalPmt))
      : scheduleAmounts(equalTotal, scheduleWeights(payments, loading))

  if (loading === 'equal') {
    const drift = Math.round(equalTotal) - amounts.reduce((a, b) => a + b, 0)
    amounts[amounts.length - 1] += drift
  }

  const installment = amounts[0] ?? 0
  const installmentLast = amounts[amounts.length - 1] ?? installment
  const totalInstallments = amounts.reduce((a, b) => a + b, 0)
  const totalPaid = downPayment + totalInstallments
  const interest = Math.max(0, totalPaid - price)

  return {
    price,
    downPayment,
    financed,
    installment,
    installmentLast,
    payments,
    cadence,
    years,
    downPaymentPct,
    loading,
    apr,
    totalPaid,
    interest,
  }
}
