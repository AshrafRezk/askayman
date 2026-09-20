import { useEffect, useState } from 'react'
import type { Lang } from '../data'
import { haptic } from '../haptics'

type PromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const labels = {
  en: {
    install: 'Install app',
    ios: 'Tap Share, then Add to Home Screen',
  },
  ar: {
    install: 'حمّل التطبيق',
    ios: 'من مشاركة، اختار إضافة إلى الشاشة الرئيسية',
  },
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function InstallApp({ lang }: { lang: Lang }) {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const [hidden, setHidden] = useState(false)
  const text = labels[lang]

  useEffect(() => {
    if (isStandalone()) {
      setHidden(true)
      return
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as PromptEvent)
    }
    const onInstalled = () => setHidden(true)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden || isStandalone() || (!promptEvent && !ios)) return null

  async function install() {
    haptic('medium')
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') setHidden(true)
      return
    }
    setIosHelp(true)
  }

  return (
    <button
      className="install"
      type="button"
      onClick={install}
      title={ios && !promptEvent ? text.ios : text.install}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3.2a1 1 0 0 1 1 1v8.2l2.4-2.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L7.2 11.4a1 1 0 1 1 1.4-1.4L11 12.4V4.2a1 1 0 0 1 1-1ZM6 18.8h12a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2Z"
        />
      </svg>
      <span>{iosHelp && !promptEvent ? text.ios : text.install}</span>
    </button>
  )
}
