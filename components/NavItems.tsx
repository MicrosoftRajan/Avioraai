'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Profile', href: '/companions' },
  { label: 'My Journey', href: '/my-journey' },
  {
    label: 'Interview Mode',
    href: '/interview-mode?activate=1',
    matchPrefix: '/interview-mode',
    icon: 'sparkles' as const,
  },
  { label: 'Subscription', href: '/subscription' },
] as const

function linkActive(
  pathname: string,
  href: string,
  matchPrefix?: string,
): boolean {
  if (matchPrefix) return pathname.startsWith(matchPrefix)
  if (href === '/') return pathname === '/'
  return pathname === href
}

const NavItems = () => {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap items-center gap-4 max-md:gap-3">
      {navLinks.map((item) => {
        const active = linkActive(pathname, item.href, 'matchPrefix' in item ? item.matchPrefix : undefined)
        return (
          <Link
            href={item.href}
            key={item.label}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm transition-colors',
              active
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {'icon' in item && item.icon === 'sparkles' ? (
              <Sparkles className="size-4 shrink-0 opacity-80" aria-hidden />
            ) : null}
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export default NavItems
