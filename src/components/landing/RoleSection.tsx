'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { ROLE_FEATURES, ROLE_TABS, type RoleTab } from './landing-data'
import { cn } from '@/lib/utils'

export default function RoleSection() {
  const [active, setActive] = useState<RoleTab>('warga')
  const role = ROLE_FEATURES[active]

  return (
    <section id="tentang" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Sistem Peran
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Satu Platform, Peran Berbeda
          </h2>
          <p className="mt-3 text-slate-600">
            Warga dan pengurus RT/RW mendapat tampilan yang sesuai kebutuhan masing-masing.
          </p>
        </div>

        <div
          className="mx-auto mt-8 flex max-w-md rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-sm"
          role="tablist"
          aria-label="Pilih peran pengguna"
        >
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon
            const selected = active === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-150',
                  selected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
                onClick={() => setActive(tab.id)}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/5"
        >
          <div className={cn('bg-gradient-to-r px-6 py-8 text-white sm:px-8', role.accent)}>
            <h3 className="text-xl font-bold sm:text-2xl">{role.title}</h3>
            <p className="mt-2 max-w-lg text-sm text-white/90 sm:text-base">
              {role.subtitle}
            </p>
          </div>
          <ul className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
            {role.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
                </span>
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
