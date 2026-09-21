export type DestinationId = 'egypt' | 'greece' | 'uae'

export type DestinationSub = {
  id: string
  name: string
  nameAr: string
  note?: string
  noteAr?: string
}

export type DestinationCountry = {
  id: DestinationId
  name: string
  nameAr: string
  hint: string
  hintAr: string
  subs?: DestinationSub[]
}

export const DESTINATIONS: DestinationCountry[] = [
  {
    id: 'egypt',
    name: 'Egypt',
    nameAr: 'مصر',
    hint: 'Primary focus — cities, coasts, and the Red Sea.',
    hintAr: 'التركيز الأساسي — المدن، السواحل، والبحر الأحمر.',
    subs: [
      { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة' },
      { id: 'tagamoa', name: 'Tagamoa', nameAr: 'التجمع' },
      { id: 'new-capital', name: 'New Capital', nameAr: 'العاصمة الإدارية' },
      { id: 'sheikh-zayed', name: 'Sheikh Zayed', nameAr: 'الشيخ زايد' },
      {
        id: 'north-coast',
        name: 'North Coast',
        nameAr: 'الساحل الشمالي',
        note: 'General · Ras El Hikma',
        noteAr: 'عام · رأس الحكمة',
      },
      {
        id: 'red-sea',
        name: 'Red Sea',
        nameAr: 'البحر الأحمر',
        note: 'El Gouna · Soma Bay',
        noteAr: 'الجونة · سوما باي',
      },
    ],
  },
  {
    id: 'greece',
    name: 'Greece',
    nameAr: 'اليونان',
    hint: 'Ask Ayman about the Greek market.',
    hintAr: 'اسأل أيمن عن السوق اليوناني.',
  },
  {
    id: 'uae',
    name: 'UAE',
    nameAr: 'الإمارات',
    hint: 'Ask Ayman about the UAE market.',
    hintAr: 'اسأل أيمن عن سوق الإمارات.',
  },
]

export const NAWY = {
  href: 'https://www.nawy.com',
  logo: 'images/partners/nawy.svg',
}
