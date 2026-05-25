'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/services/supabase/client'
import CitizenOnboardingWizard from './citizen/CitizenOnboardingWizard'

const ROLE_BACKDROPS: Record<string, {
  gradientFrom: string
  glowBg: string
}> = {
  warga: {
    gradientFrom: 'from-[#EAF1FF]',
    glowBg: 'bg-[#2563EB]/5'
  },
  rt: {
    gradientFrom: 'from-[#E6F4EA]',
    glowBg: 'bg-[#10B981]/5'
  },
  rw: {
    gradientFrom: 'from-[#F3E8FF]',
    glowBg: 'bg-[#8B5CF6]/5'
  },
  admin: {
    gradientFrom: 'from-[#E0F7FA]',
    glowBg: 'bg-[#00ACC1]/5'
  },
  superadmin: {
    gradientFrom: 'from-[#F5F3FF]',
    glowBg: 'bg-[#6D28D9]/5'
  }
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const role = user?.role || 'warga'
  const backdrop = ROLE_BACKDROPS[role] || ROLE_BACKDROPS.warga
  
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  useEffect(() => {
    async function checkProfile() {
      if (!user || user.role !== 'warga') {
        setCheckingProfile(false)
        return
      }
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('citizen_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!data && !error) {
        setNeedsOnboarding(true)
      }
      setCheckingProfile(false)
    }

    checkProfile()
  }, [user])

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F7FC] relative overflow-clip">
      {/* Subtle background ambient gradients & wave shapes */}
      <div className={`absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-b ${backdrop.gradientFrom} to-transparent rounded-full blur-[100px] opacity-70 -z-10 pointer-events-none`} />
      <div className={`absolute top-[20%] left-[250px] w-[350px] h-[350px] ${backdrop.glowBg} rounded-full blur-[80px] opacity-50 -z-10 pointer-events-none`} />
      
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen flex flex-col pb-24 md:pb-0 relative z-10">
        {/* Mobile Navigation Header */}
        <header className="md:hidden sticky top-0 z-40">
          <MobileNav />
        </header>

        {/* Content main */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Citizen Onboarding Modal */}
      {!checkingProfile && needsOnboarding && <CitizenOnboardingWizard />}
    </div>
  )
}
