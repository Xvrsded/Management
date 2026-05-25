export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile: header gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-500 px-6 py-8 text-center text-white md:hidden">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-base font-bold">
          RT
        </span>
        <h1 className="mt-3 text-lg font-bold">RT/RW Digital</h1>
        <p className="mt-1 text-sm text-blue-100">Sistem Administrasi Warga Modern</p>
      </div>

      {/* Desktop: left panel */}
      <div className="hidden w-[42%] max-w-md flex-col justify-center bg-gradient-to-br from-blue-600 to-indigo-500 px-10 py-12 text-white md:flex lg:px-14">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
          RT
        </span>
        <h1 className="mt-6 text-2xl font-bold leading-tight">RT/RW Digital</h1>
        <p className="mt-2 text-sm leading-relaxed text-blue-100">
          Sistem Administrasi Warga Modern — ringan, aman, dan mudah digunakan.
        </p>
        <ul className="mt-8 space-y-2 text-sm text-blue-50">
          <li>✓ Iuran & surat digital</li>
          <li>✓ Mobile-friendly</li>
          <li>✓ Aman untuk data warga</li>
        </ul>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-4 py-8 sm:px-8">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  )
}
