import '@/styles/globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'RT/RW Management — Platform Digital RT/RW Modern',
  description:
    'Aplikasi ringan untuk pengelolaan iuran, surat, laporan warga, kegiatan, dan administrasi lingkungan RT/RW.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
