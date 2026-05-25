import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { FOOTER_LINKS } from './landing-data'

export default function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer id="kontak" className="border-t border-slate-200/80 bg-white/70 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-emerald-600 text-sm font-bold text-white">
                RT
              </span>
              <span className="text-sm font-semibold text-slate-800">RT/RW Management</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Platform digital modern untuk pengelolaan administrasi RT/RW yang ringan,
              aman, dan mudah digunakan semua kalangan warga.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Menu Cepat</h3>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors duration-150 hover:text-slate-800"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Kontak</h3>
            <ul className="mt-3 space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                admin@rt-rw.local
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                +62 812-0000-0000
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                RT 05 / RW 03, Jakarta
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {year} RT/RW Management. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  )
}
