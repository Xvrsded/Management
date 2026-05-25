'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from './landing-data'
import { cn } from '@/lib/utils'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200',
        scrolled
          ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6"
        aria-label="Navigasi utama"
      >
        <Link
          href="#beranda"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          onClick={closeMenu}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-emerald-600 text-sm font-bold text-white shadow-md shadow-blue-900/15">
            RT
          </span>
          <span className="hidden text-sm font-semibold text-slate-800 sm:block">
            RT/RW <span className="font-normal text-slate-500">Management</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition-opacity duration-150 hover:opacity-95"
          >
            Daftar
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 top-14 z-40 bg-slate-900/20 md:hidden"
          onClick={closeMenu}
          aria-hidden
        />
      )}

      <div
        id="mobile-menu-panel"
        className={cn(
          'fixed right-0 top-14 z-50 h-[calc(100dvh-3.5rem)] w-[min(100%,20rem)] border-l border-slate-200 bg-white shadow-xl transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <hr className="my-2 border-slate-100" />
          <Link
            href="/login"
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={closeMenu}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="mt-1 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
            onClick={closeMenu}
          >
            Daftar
          </Link>
        </div>
      </div>
    </header>
  )
}
