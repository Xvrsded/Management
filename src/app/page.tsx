import { Suspense } from 'react'
import { createClient } from '@/services/supabase/server'
import { redirect } from 'next/navigation'
import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingHero from '@/components/landing/LandingHero'
import LandingFeatures from '@/components/landing/LandingFeatures'
import RoleSection from '@/components/landing/RoleSection'
import LetterFlow from '@/components/landing/LetterFlow'
import DuesPreviewAsync from '@/components/landing/DuesPreviewAsync'
import Advantages from '@/components/landing/Advantages'
import LandingStatsAsync from '@/components/landing/LandingStatsAsync'
import LandingStatsSkeleton from '@/components/landing/LandingStatsSkeleton'
import CtaSection from '@/components/landing/CtaSection'
import LandingFooter from '@/components/landing/LandingFooter'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 text-slate-800">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <RoleSection />
        <LetterFlow />
        <Suspense
          fallback={
            <section className="px-4 py-16 sm:px-6">
              <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-2xl bg-white/60" />
            </section>
          }
        >
          <DuesPreviewAsync />
        </Suspense>
        <Advantages />
        <Suspense fallback={<LandingStatsSkeleton />}>
          <LandingStatsAsync />
        </Suspense>
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
