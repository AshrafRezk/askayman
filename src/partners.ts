export type PartnerRegion = 'east' | 'west' | 'coast' | 'greece' | 'uae'
export type PartnerView = PartnerRegion | 'all' | 'taj'
export type PartnerGroup = 'sodic' | 'taj' | 'sarai' | 'greece' | 'uae'

export type PartnerCompound = {
  id: string
  name: string
  nameAr: string
  region: PartnerRegion
  group: PartnerGroup
  lat: number
  lng: number
  zoom: number
  logo: string
  status: 'explore' | 'sold'
  detail: string
  detailAr: string
  /** Existing traced polygon to fly to when this phase has no unique parcel. */
  parcelId?: string
}

const TAJ_LOGO = 'images/partners/taj-city.jpg'
const TAJ_CITY = { lat: 30.06451, lng: 31.41224 }

export const PARTNER_REGIONS: {
  id: PartnerView
  name: string
  nameAr: string
  lat: number
  lng: number
  zoom: number
}[] = [
  { id: 'all', name: 'All compounds', nameAr: 'كل الكمباوندات', lat: 30.3, lng: 30.3, zoom: 6.4 },
  { id: 'taj', name: 'Taj City', nameAr: 'تاج سيتي', lat: 30.0645, lng: 31.4122, zoom: 14.2 },
  { id: 'east', name: 'East Cairo', nameAr: 'شرق القاهرة', lat: 30.07, lng: 31.577, zoom: 11.2 },
  { id: 'west', name: 'West Cairo', nameAr: 'غرب القاهرة', lat: 30.051, lng: 30.913, zoom: 11.6 },
  { id: 'coast', name: 'North Coast', nameAr: 'الساحل الشمالي', lat: 31.13, lng: 28.045, zoom: 11.4 },
  { id: 'greece', name: 'Greece', nameAr: 'اليونان', lat: 37.55, lng: 23.15, zoom: 6.6 },
  { id: 'uae', name: 'UAE', nameAr: 'الإمارات', lat: 25.08, lng: 55.2, zoom: 8.6 },
]

export function compoundInView(item: PartnerCompound, view: PartnerView) {
  if (view === 'all') return true
  if (view === 'taj') return item.group === 'taj'
  return item.region === view
}

/** Zones with accurate traced polygons on the map — names only, no other Taj land. */
export const TAJ_MAP_ZONE_IDS = ['taj-sultan', 'taj-shalya', 'taj-kinda', 'taj-clubside'] as const

export function isTajZone(item: PartnerCompound) {
  return item.group === 'taj' && item.id !== 'taj-city'
}

export function isTajMapZone(item: PartnerCompound) {
  return (TAJ_MAP_ZONE_IDS as readonly string[]).includes(item.id)
}

export function chipInView(item: PartnerCompound, view: PartnerView) {
  if (isTajZone(item)) return false
  if (view === 'all') return isFlagship(item)
  return compoundInView(item, view)
}

/** World / all-markets view: highest-budget and marquee names only. */
export const FLAGSHIP_IDS = new Set([
  'taj-city',
  'villette',
  'the-estates',
  'caesar',
  'june',
  'eastown',
  'sarai',
  'costa-navarino',
  'ellinikon',
  'downtown-dubai',
  'palm-jumeirah',
  'dubai-hills',
  'saadiyat',
])

export function isFlagship(item: PartnerCompound) {
  return FLAGSHIP_IDS.has(item.id)
}

export function isIntl(item: PartnerCompound) {
  return item.group === 'greece' || item.group === 'uae'
}

export function zonesForSelection(selected: string | null) {
  const item = PARTNER_COMPOUNDS.find((entry) => entry.id === selected)
  if (!item || item.group !== 'taj') return []
  return PARTNER_COMPOUNDS.filter(isTajMapZone)
}

export const PARTNER_COMPOUNDS: PartnerCompound[] = [
  {
    id: 'taj-city',
    name: 'Taj City',
    nameAr: 'تاج سيتي',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.2,
    logo: TAJ_LOGO,
    status: 'explore',
    detail: 'Madinet Masr · New Cairo on the Cairo–Suez Road. One city, many phases.',
    detailAr: 'مدينة مصر · القاهرة الجديدة على طريق القاهرة السويس. مدينة واحدة، مراحل كتير.',
  },
  {
    id: 'taj-tzone',
    name: 'Zone T',
    nameAr: 'زون تي',
    region: 'east',
    group: 'taj',
    lat: 30.068694,
    lng: 31.407813,
    zoom: 16,
    logo: TAJ_LOGO,
    status: 'explore',
    detail: 'Apartments and villas · immediate handover · 20% down, 7 years.',
    detailAr: 'شقق وفيلات · استلام فوري · مقدم ٢٠٪ على ٧ سنين.',
  },
  {
    id: 'taj-shalya',
    name: 'Shalya',
    nameAr: 'شاليا',
    region: 'east',
    group: 'taj',
    lat: 30.0628,
    lng: 31.4148,
    zoom: 16,
    logo: TAJ_LOGO,
    status: 'sold',
    detail: '289,000 m² · apartments and duplexes 69–300 m² · sold out.',
    detailAr: '٢٨٩ ألف م² · شقق ودوبلكس ٦٩–٣٠٠ م² · مباع بالكامل.',
  },
  {
    id: 'taj-lake-park',
    name: 'Lake Park',
    nameAr: 'ليك بارك',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.6,
    logo: TAJ_LOGO,
    status: 'sold',
    parcelId: 'taj-city',
    detail: 'Lake Park Studios · 58–185 m² beside the lakes · sold out.',
    detailAr: 'ليك بارك ستوديوز · ٥٨–١٨٥ م² على البحيرات · مباع بالكامل.',
  },
  {
    id: 'taj-clubside',
    name: 'Club Side',
    nameAr: 'كلوب سايد',
    region: 'east',
    group: 'taj',
    lat: 30.0673,
    lng: 31.4128,
    zoom: 16,
    logo: TAJ_LOGO,
    status: 'sold',
    detail: 'Clubside · apartments from 80 m² · Klub Kayan · sold out.',
    detailAr: 'كلوبسايد · شقق من ٨٠ م² · كلوب كيان · مباع بالكامل.',
  },
  {
    id: 'taj-origami-garden',
    name: 'Origami Garden',
    nameAr: 'أوريجامي جاردن',
    region: 'east',
    group: 'taj',
    lat: 30.06669,
    lng: 31.412196,
    zoom: 15.2,
    logo: TAJ_LOGO,
    status: 'explore',
    parcelId: 'taj-origami',
    detail: 'Villa phase inside the Origami land · 160–265 m².',
    detailAr: 'مرحلة فيلات جوه أرض أوريجامي · ١٦٠–٢٦٥ م².',
  },
  {
    id: 'taj-origami',
    name: 'Origami',
    nameAr: 'أوريجامي',
    region: 'east',
    group: 'taj',
    lat: 30.06669,
    lng: 31.412196,
    zoom: 15.2,
    logo: TAJ_LOGO,
    status: 'sold',
    detail: '58–240 m² · Minka · sold out · remaining Taj City master-plan.',
    detailAr: '٥٨–٢٤٠ م² · مينكا · مباع بالكامل · باقي الماستر بلان لتاج سيتي.',
  },
  {
    id: 'taj-origami-golf',
    name: 'Origami Golf',
    nameAr: 'أوريجامي جولف',
    region: 'east',
    group: 'taj',
    lat: 30.06669,
    lng: 31.412196,
    zoom: 15.2,
    logo: TAJ_LOGO,
    status: 'explore',
    parcelId: 'taj-origami',
    detail: '70–224 m² · 0% down / 12 years.',
    detailAr: '٧٠–٢٢٤ م² · بدون مقدم / ١٢ سنة.',
  },
  {
    id: 'taj-sultan',
    name: 'Taj Sultan',
    nameAr: 'تاج سلطان',
    region: 'east',
    group: 'taj',
    lat: 30.0611,
    lng: 31.408,
    zoom: 16,
    logo: TAJ_LOGO,
    status: 'sold',
    detail: '30,000 m² park · apartments and villas · sold out.',
    detailAr: 'حديقة ٣٠ ألف م² · شقق وفيلات · مباع بالكامل.',
  },
  {
    id: 'taj-elect',
    name: 'Elect',
    nameAr: 'إيليكت',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.6,
    logo: TAJ_LOGO,
    status: 'sold',
    parcelId: 'taj-city',
    detail: 'Villas 145–265 m² · sold out.',
    detailAr: 'فيلات ١٤٥–٢٦٥ م² · مباع بالكامل.',
  },
  {
    id: 'taj-kinda',
    name: 'Kinda',
    nameAr: 'كيندا',
    region: 'east',
    group: 'taj',
    lat: 30.0684,
    lng: 31.4225,
    zoom: 16,
    logo: TAJ_LOGO,
    status: 'explore',
    detail: 'Office and commercial · Kinda district inside Taj City.',
    detailAr: 'مكاتب وتجاري · منطقة كيندا جوه تاج سيتي.',
  },
  {
    id: 'taj-ville',
    name: 'Taj Ville',
    nameAr: 'تاج فيل',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.6,
    logo: TAJ_LOGO,
    status: 'sold',
    parcelId: 'taj-city',
    detail: 'Villas and twins 194–265 m² · sold out.',
    detailAr: 'فيلات وتوينز ١٩٤–٢٦٥ م² · مباع بالكامل.',
  },
  {
    id: 'taj-park-residence',
    name: 'Park Residence',
    nameAr: 'بارك ريزيدنس',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.6,
    logo: TAJ_LOGO,
    status: 'sold',
    parcelId: 'taj-city',
    detail: '83–350 m² · glass and wood · sold out.',
    detailAr: '٨٣–٣٥٠ م² · زجاج وخشب · مباع بالكامل.',
  },
  {
    id: 'taj-gardens',
    name: 'Taj Gardens',
    nameAr: 'تاج جاردنز',
    region: 'east',
    group: 'taj',
    lat: TAJ_CITY.lat,
    lng: TAJ_CITY.lng,
    zoom: 14.6,
    logo: TAJ_LOGO,
    status: 'sold',
    parcelId: 'taj-city',
    detail: 'Benoy · 46,000 m² · 61–191 m² · sold out.',
    detailAr: 'بينوي · ٤٦ ألف م² · ٦١–١٩١ م² · مباع بالكامل.',
  },
  {
    id: 'kattameya-plaza',
    name: 'Kattameya Plaza',
    nameAr: 'قطامية بلازا',
    region: 'east',
    group: 'sodic',
    lat: 30.036557785230766,
    lng: 31.490279674530026,
    zoom: 14.2,
    logo: 'images/partners/kattameya-plaza.png',
    status: 'sold',
    detail: 'SODIC · New Cairo.',
    detailAr: 'سوديك · القاهرة الجديدة.',
  },
  {
    id: 'eastown',
    name: 'Eastown',
    nameAr: 'إيستاون',
    region: 'east',
    group: 'sodic',
    lat: 30.012985336567368,
    lng: 31.515515760371557,
    zoom: 14.2,
    logo: 'images/partners/eastown.png',
    status: 'sold',
    detail: 'SODIC · New Cairo.',
    detailAr: 'سوديك · القاهرة الجديدة.',
  },
  {
    id: 'villette',
    name: 'Villette',
    nameAr: 'فيليت',
    region: 'east',
    group: 'sodic',
    lat: 30.02835,
    lng: 31.5397595,
    zoom: 14,
    logo: 'images/partners/villette.png',
    status: 'explore',
    detail: 'SODIC · New Cairo.',
    detailAr: 'سوديك · القاهرة الجديدة.',
  },
  {
    id: 'sodic-east',
    name: 'SODIC East',
    nameAr: 'سوديك إيست',
    region: 'east',
    group: 'sodic',
    lat: 30.1586759,
    lng: 31.6675824,
    zoom: 14,
    logo: 'images/partners/sodic-east.png',
    status: 'explore',
    detail: 'SODIC · Mostakbal City corridor.',
    detailAr: 'سوديك · محور مدينة المستقبل.',
  },
  {
    id: 'sarai',
    name: 'Sarai',
    nameAr: 'سرايا',
    region: 'east',
    group: 'sarai',
    lat: 30.104865,
    lng: 31.698133,
    zoom: 13.6,
    logo: TAJ_LOGO,
    status: 'explore',
    detail:
      'Also called Taj Sarai · MNHD Mostakbal City, beside Madinaty / TMG — not inside Taj City.',
    detailAr: 'بيتقال عليها تاج سرايا · مدينة مصر في مدينة المستقبل، جنب مدينتي / طلعت مصطفى — مش جوه تاج سيتي.',
  },
  {
    id: 'sodic-west',
    name: 'SODIC West',
    nameAr: 'سوديك ويست',
    region: 'west',
    group: 'sodic',
    lat: 30.069260622164368,
    lng: 30.95695956757194,
    zoom: 14,
    logo: 'images/partners/sodic-west.png',
    status: 'sold',
    detail: 'SODIC · Sheikh Zayed / West Cairo.',
    detailAr: 'سوديك · الشيخ زايد / غرب القاهرة.',
  },
  {
    id: 'the-estates',
    name: 'The Estates',
    nameAr: 'ذا إستيتس',
    region: 'west',
    group: 'sodic',
    lat: 30.079,
    lng: 30.87833,
    zoom: 14.6,
    logo: 'images/partners/the-estates.png',
    status: 'explore',
    detail: 'SODIC · West Cairo.',
    detailAr: 'سوديك · غرب القاهرة.',
  },
  {
    id: 'karmell',
    name: 'Karmell',
    nameAr: 'كارميل',
    region: 'west',
    group: 'sodic',
    lat: 30.0610487,
    lng: 30.878003,
    zoom: 14.8,
    logo: 'images/partners/karmell.png',
    status: 'explore',
    detail: 'SODIC · West Cairo.',
    detailAr: 'سوديك · غرب القاهرة.',
  },
  {
    id: 'october-plaza',
    name: 'October Plaza',
    nameAr: 'أكتوبر بلازا',
    region: 'west',
    group: 'sodic',
    lat: 29.998250310787924,
    lng: 30.92364263534546,
    zoom: 14.2,
    logo: 'images/partners/october-plaza.png',
    status: 'sold',
    detail: 'SODIC · 6th of October.',
    detailAr: 'سوديك · ٦ أكتوبر.',
  },
  {
    id: 'june',
    name: 'June',
    nameAr: 'جون',
    region: 'coast',
    group: 'sodic',
    lat: 31.0777321,
    lng: 28.0887418,
    zoom: 13.8,
    logo: 'images/partners/june.png',
    status: 'explore',
    detail: 'SODIC · North Coast.',
    detailAr: 'سوديك · الساحل الشمالي.',
  },
  {
    id: 'caesar',
    name: 'Caesar',
    nameAr: 'سيزر',
    region: 'coast',
    group: 'sodic',
    lat: 31.0795179,
    lng: 28.0092651,
    zoom: 14,
    logo: 'images/partners/caesar.png',
    status: 'explore',
    detail: 'SODIC · North Coast.',
    detailAr: 'سوديك · الساحل الشمالي.',
  },
  {
    id: 'ogami',
    name: 'Ogami',
    nameAr: 'أوغامي',
    region: 'coast',
    group: 'sodic',
    lat: 31.0787221,
    lng: 27.9859435,
    zoom: 14,
    logo: 'images/partners/ogami.png',
    status: 'explore',
    detail: 'SODIC · North Coast.',
    detailAr: 'سوديك · الساحل الشمالي.',
  },
  {
    id: 'costa-navarino',
    name: 'Costa Navarino',
    nameAr: 'كوستا نافارينو',
    region: 'greece',
    group: 'greece',
    lat: 36.9897,
    lng: 21.6947,
    zoom: 13.4,
    logo: '',
    status: 'explore',
    detail: 'Messinia · Greece’s flagship resort destination. Ask Ayman about the Greek market.',
    detailAr: 'ميسينا · الوجهة الأبرز في اليونان. اسأل أيمن عن السوق اليوناني.',
  },
  {
    id: 'ellinikon',
    name: 'The Ellinikon',
    nameAr: 'الألينكون',
    region: 'greece',
    group: 'greece',
    lat: 37.886,
    lng: 23.737,
    zoom: 13.6,
    logo: '',
    status: 'explore',
    detail: 'Athens Riviera · Lamda Development. Ask Ayman about the Greek market.',
    detailAr: 'ريفييرا أثينا · لامدا. اسأل أيمن عن السوق اليوناني.',
  },
  {
    id: 'downtown-dubai',
    name: 'Downtown Dubai',
    nameAr: 'داون تاون دبي',
    region: 'uae',
    group: 'uae',
    lat: 25.1972,
    lng: 55.2744,
    zoom: 14.4,
    logo: '',
    status: 'explore',
    detail: 'Emaar · Burj Khalifa district. Ask Ayman about the UAE market.',
    detailAr: 'إعمار · منطقة برج خليفة. اسأل أيمن عن سوق الإمارات.',
  },
  {
    id: 'palm-jumeirah',
    name: 'Palm Jumeirah',
    nameAr: 'نخلة جميرا',
    region: 'uae',
    group: 'uae',
    lat: 25.1124,
    lng: 55.139,
    zoom: 13.8,
    logo: '',
    status: 'explore',
    detail: 'Iconic palm · villas and branded residences. Ask Ayman about the UAE market.',
    detailAr: 'النخلة · فيلات ووحدات بعلامات عالمية. اسأل أيمن عن سوق الإمارات.',
  },
  {
    id: 'dubai-hills',
    name: 'Dubai Hills',
    nameAr: 'دبي هيلز',
    region: 'uae',
    group: 'uae',
    lat: 25.109,
    lng: 55.244,
    zoom: 13.6,
    logo: '',
    status: 'explore',
    detail: 'Emaar · golf community. Ask Ayman about the UAE market.',
    detailAr: 'إعمار · مجتمع الجولف. اسأل أيمن عن سوق الإمارات.',
  },
  {
    id: 'saadiyat',
    name: 'Saadiyat Island',
    nameAr: 'جزيرة السعديات',
    region: 'uae',
    group: 'uae',
    lat: 24.533,
    lng: 54.436,
    zoom: 13.2,
    logo: '',
    status: 'explore',
    detail: 'Abu Dhabi cultural district · luxury residences. Ask Ayman about the UAE market.',
    detailAr: 'أبوظبي · الحي الثقافي والإقامة الفاخرة. اسأل أيمن عن سوق الإمارات.',
  },
]
