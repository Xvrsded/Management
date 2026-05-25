import Link from 'next/link'
import { ArrowRight, Mail } from 'lucide-react'

export default function CtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-emerald-700 px-6 py-10 text-center shadow-xl shadow-blue-900/20 sm:px-12 sm:py-14">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Mulai Digitalisasi Lingkungan Anda Sekarang
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100 sm:text-base">
          Bergabung dengan warga dan pengurus RT/RW yang sudah mengelola administrasi
          secara modern, cepat, dan transparan.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-blue-800 transition-opacity duration-150 hover:opacity-95 sm:w-auto"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href="mailto:admin@rt-rw.local"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/20 sm:w-auto"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Hubungi Admin
          </a>
        </div>
      </div>
    </section>
  )
}
