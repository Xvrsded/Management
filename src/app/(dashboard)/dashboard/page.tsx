import { createClient } from '@/services/supabase/server'
import { createAdminClient } from '@/services/supabase/admin'
import { redirect } from 'next/navigation'
import { DuePayment } from '@/components/dashboard/DuesSummaryWidget'
import { Announcement } from '@/components/dashboard/AnnouncementsWidget'
import { NotificationItem } from '@/components/dashboard/RightInfoPanel'

// Import role-specific customized dashboard views
import WargaDashboard from '@/components/dashboard/role/WargaDashboard'
import RtDashboard from '@/components/dashboard/role/RtDashboard'
import RwDashboard from '@/components/dashboard/role/RwDashboard'
import AdminDashboard from '@/components/dashboard/role/AdminDashboard'
import SuperadminDashboard from '@/components/dashboard/role/SuperadminDashboard'

export const revalidate = 0 // Disable caching to ensure real-time updates

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch role & name from single source of truth (profiles table)
  let userProfile = {
    fullName: user.user_metadata?.full_name || 'Warga',
    role: user.user_metadata?.role || 'warga',
    email: user.email || ''
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, email')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      userProfile = {
        fullName: profile.full_name,
        role: profile.role,
        email: profile.email
      }
    }
  } catch (err) {
    console.warn('Failed to query profiles table, using metadata fallback:', err)
  }

  let dues: DuePayment[] = []
  let citizenDemographics: any = null
  let totalRegionalDues = 0
  let regionalCount = 0

  if (userProfile.role === 'warga') {
    // CITIZEN FLOW: Query personal data in parallel for high performance
    try {
      const [
        duesRes,
        demographicsRes,
        lettersRes,
        activitiesRes,
        reportsRes
      ] = await Promise.all([
        // 1. Dues
        supabase
          .from('due_payments')
          .select('*, dues(title)')
          .eq('profile_id', user.id)
          .in('status', ['unpaid', 'pending', 'pending_verification', 'rejected'])
          .order('due_date', { ascending: true }),
        // 2. Demographics (includes family_id)
        supabase
          .from('citizen_profiles')
          .select('nik, kk, address, rt, rw, phone, gender, date_of_birth, family_id, id')
          .eq('id', user.id)
          .maybeSingle(),
        // 3. Latest Letters
        supabase
          .from('letter_requests')
          .select('id, request_code, letter_type, purpose, status, submitted_at, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        // 4. Latest Activities
        supabase
          .from('activity_logs')
          .select('id, action, entity_type, details, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        // 5. Latest Reports
        supabase
          .from('reports')
          .select('id, category, title, status, created_at')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
      ])

      // Map Dues
      if (duesRes.data) {
        dues = duesRes.data.map((item: any) => {
          let mappedStatus = item.status
          if (item.status === 'pending') mappedStatus = 'pending_verification'
          if (item.status === 'paid') mappedStatus = 'verified'
          return { 
            ...item, 
            status: mappedStatus,
            title: (item as any).dues?.title || item.title || 'Iuran'
          }
        }) as DuePayment[]
      }

      // Extract Demographics
      if (demographicsRes.data) {
        citizenDemographics = demographicsRes.data
        
        // 5. Fetch House info if family_id exists
        if (citizenDemographics.family_id) {
          const { data: familyHouse } = await supabase
            .from('families')
            .select('house_id, houses(house_number, address, latitude, longitude)')
            .eq('id', citizenDemographics.family_id)
            .maybeSingle()
            
          if (familyHouse && familyHouse.houses) {
            citizenDemographics.house = familyHouse.houses
          }
        }
      }

      // Attach extra citizen-specific arrays to demographics object for easy prop passing
      if (citizenDemographics) {
        citizenDemographics.letters = lettersRes.data || []
        citizenDemographics.activities = activitiesRes.data || []
        citizenDemographics.reports = reportsRes.data || []
      } else {
        citizenDemographics = {
          letters: lettersRes.data || [],
          activities: activitiesRes.data || [],
          reports: reportsRes.data || []
        }
      }

    } catch (err) {
      console.warn('Failed to fetch comprehensive citizen data', err)
    }
  } else {
    // STAFF/ADMIN FLOW: Query aggregate regional outstanding dues metrics
    try {
      const { data } = await supabase
        .from('due_payments')
        .select('amount, status')
        .in('status', ['unpaid', 'pending', 'pending_verification', 'rejected'])

      if (data) {
        totalRegionalDues = data.reduce((sum, item) => sum + Number(item.amount), 0)
        regionalCount = data.length
      }
    } catch (err) {
      console.warn('Failed to fetch regional dues metrics.')
    }
  }

  // 4. Fetch Latest Announcements (Limit 3) - Visible to everyone
  let announcements: Announcement[] = []
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    announcements = (data as Announcement[]) ?? []
  } catch (err) {
    const { logSupabaseError } = await import('@/lib/supabase/errors')
    logSupabaseError('dashboard announcements', err)
  }

  // 5. Fetch Recent Notifications (Limit 5)
  let notifications: NotificationItem[] = []
  try {
    let query = supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at, profile_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (userProfile.role === 'warga') {
      // Citizens see only their own account alerts
      query = query.eq('profile_id', user.id)
    }

    const { data } = await query
    if (data) {
      notifications = data as NotificationItem[]
    }
  } catch (err) {
    console.warn('Failed to fetch notifications, using fallback empty state.', err)
  }

  // 6. Fetch RT Administration/Regional metrics (strictly for Right Info Panel staff view)
  let wargaCount = 0
  let rumahCount = 0
  let keluargaCount = 0
  let mapHouses: any[] = []
  let pendingSuratCount = 0
  let pendingIuranCount = 0
  let unresolvedReportsCount = 0

  if (userProfile.role !== 'warga') {
    try {
      const adminSupabase = createAdminClient() || supabase

      // Fetch total profiles count
      const { count: profCount } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      if (profCount !== null) {
        wargaCount = profCount
      }

      // Fetch total houses count
      const { count: hCount, error: housesCountError } = await adminSupabase
        .from('houses')
        .select('id', { count: 'exact', head: true })
      if (housesCountError) throw housesCountError
      if (hCount !== null) {
        rumahCount = hCount
      }

      // Fetch unique KK count from citizen_profiles (Optimized: only fetch the needed column)
      const { data: cpData } = await adminSupabase
        .from('citizen_profiles')
        .select('kk')
      if (cpData) {
        const uniqueKK = new Set(cpData.map(item => item.kk).filter(Boolean))
        keluargaCount = uniqueKK.size > 0 ? uniqueKK.size : cpData.length
      }

      // Fetch pending action metrics in parallel
      const [suratCountRes, iuranCountRes, reportsCountRes] = await Promise.all([
        adminSupabase.from('letter_requests').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending_rt', 'pending_rw']),
        adminSupabase.from('due_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification'),
        adminSupabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'reviewing', 'in_progress'])
      ])

      pendingSuratCount = suratCountRes.count || 0
      pendingIuranCount = iuranCountRes.count || 0
      unresolvedReportsCount = reportsCountRes.count || 0

      // Fetch Map Houses data only for Admin
      if (userProfile.role === 'admin') {
        const { data: houseData, error: hError } = await adminSupabase
          .from('houses')
          .select('id, house_number, latitude, longitude, address, owner_name')
        
        const { data: famData } = await adminSupabase
          .from('families')
          .select('id, house_id')

        const { data: cpMapData } = await adminSupabase
          .from('citizen_profiles')
          .select('family_id, phone, profiles(full_name)')

        if (houseData) {
          mapHouses = houseData.map((h: any) => {
            // Find family for this house
            const family = famData?.find((f: any) => f.house_id === h.id)
            // Find head of family from citizen_profiles
            const head = cpMapData?.find((c: any) => c.family_id === family?.id)
            
            // Determine fullName from the nested profile object or fallback to owner_name
            let fname = h.owner_name || 'Tidak Diketahui'
            if (head?.profiles) {
              if (Array.isArray(head.profiles)) fname = head.profiles[0]?.full_name || fname
              else fname = (head.profiles as any).full_name || fname
            }
            return {
              id: h.id,
              latitude: h.latitude,
              longitude: h.longitude,
              house_number: h.house_number,
              address: h.address,
              fullName: fname,
              phone: head?.phone || '-'
            }
          })
        }
      }
    } catch (err) {
      const { logSupabaseError } = await import('@/lib/supabase/errors')
      logSupabaseError('dashboard admin stats', err)
    }
  }

  // 7. Route and render appropriate dashboard view matching user role
  switch (userProfile.role) {
    case 'rt':
      return (
        <RtDashboard 
          fullName={userProfile.fullName}
          wargaCount={wargaCount}
          rumahCount={rumahCount}
          keluargaCount={keluargaCount}
          totalRegionalDues={totalRegionalDues}
          regionalCount={regionalCount}
          announcements={announcements}
          notifications={notifications}
          dues={dues}
        />
      )
    case 'rw':
      return (
        <RwDashboard 
          fullName={userProfile.fullName}
          wargaCount={wargaCount}
          rumahCount={rumahCount}
          keluargaCount={keluargaCount}
          announcements={announcements}
          notifications={notifications}
        />
      )
    case 'admin':
      return (
        <AdminDashboard 
          fullName={userProfile.fullName}
          wargaCount={wargaCount}
          rumahCount={rumahCount}
          keluargaCount={keluargaCount}
          notifications={notifications}
          mapHouses={mapHouses}
          pendingSuratCount={pendingSuratCount}
          pendingIuranCount={pendingIuranCount}
          unresolvedReportsCount={unresolvedReportsCount}
        />
      )
    case 'superadmin':
      return (
        <SuperadminDashboard 
          fullName={userProfile.fullName}
          wargaCount={wargaCount}
          notifications={notifications}
        />
      )
    case 'warga':
    default:
      return (
        <WargaDashboard 
          fullName={userProfile.fullName}
          email={userProfile.email}
          dues={dues}
          announcements={announcements}
          notifications={notifications}
          citizenDemographics={citizenDemographics}
        />
      )
  }
}
