import { NextResponse } from 'next/server'
import { createClient } from '@/services/supabase/server'
import { z } from 'zod'
import { formatRegionNumber } from '@/lib/region-format'

const onboardingSchema = z.object({
  nik: z.string().length(16, "NIK harus 16 digit"),
  kk: z.string().length(16, "KK harus 16 digit"),
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  placeOfBirth: z.string().min(1, "Tempat lahir wajib diisi"),
  dateOfBirth: z.string(),
  gender: z.enum(['L', 'P']),
  religion: z.string().min(1, "Agama wajib diisi"),
  maritalStatus: z.string().min(1, "Status pernikahan wajib diisi"),
  occupation: z.string().min(1, "Pekerjaan wajib diisi"),
  phone: z.string().min(10, "Nomor HP tidak valid"),
  rwNumber: z.string().min(1, "RW wajib dipilih"),
  rtNumber: z.string().min(1, "RT wajib dipilih"),
  houseNumber: z.string().min(1, "Nomor rumah wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  documents: z.object({
    ktpUrl: z.string().optional(),
    kkUrl: z.string().optional(),
    houseUrl: z.string().optional()
  }).optional()
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Check auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const body = await req.json()
    const parsedData = onboardingSchema.safeParse(body)
    
    if (!parsedData.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parsedData.error.flatten() 
      }, { status: 400 })
    }

    const formData = parsedData.data

    // Sanitize RT/RW using the standard formatRegionNumber utility
    const safeRwNumber = formatRegionNumber(formData.rwNumber)
    const safeRtNumber = formatRegionNumber(formData.rtNumber)

    console.log('FORM DATA', formData)

    console.log('RW QUERY VALUE', {
      rw: safeRwNumber,
      type: typeof safeRwNumber,
      exact: JSON.stringify(safeRwNumber)
    })

    // 3. Prevent duplicate citizen_profiles
    const { data: existingProfile } = await supabase
      .from('citizen_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ error: 'Citizen profile already exists' }, { status: 400 })
    }

    // 4. Resolve RW and RT IDs
    console.log('RW LOOKUP DEBUG', {
      incoming: safeRwNumber,
    })

    const { data: rw, error: rwError } = await supabase
      .from('rw')
      .select('id, rw_number')
      .eq('rw_number', safeRwNumber)
      .maybeSingle()

    console.log({
      rw,
      rwError,
    })

    if (!rw) {
      throw new Error(`Data RW dengan nomor "${safeRwNumber}" tidak ditemukan di database. Pastikan database Anda benar-benar berisi rw_number: "${safeRwNumber}"`)
    }

    const { data: rt, error: rtError } = await supabase
      .from('rt')
      .select('id, rt_number')
      .eq('rw_id', rw.id)
      .eq('rt_number', safeRtNumber)
      .maybeSingle()

    console.log({
      rt,
      rtError,
    })

    if (!rt) {
      throw new Error(`Data RT dengan nomor "${safeRtNumber}" tidak ditemukan di database.`)
    }

    // 5. Check/Create House
    let houseId: string
    const { data: existingHouse } = await supabase
      .from('houses')
      .select('id')
      .eq('rt_id', rt.id)
      .eq('house_number', formData.houseNumber)
      .maybeSingle()

    if (existingHouse) {
      houseId = existingHouse.id
      // Update coordinates if missing and newly provided
      if (formData.latitude && formData.longitude) {
        await supabase.from('houses').update({
          latitude: formData.latitude,
          longitude: formData.longitude
        }).eq('id', houseId)
      }
    } else {
      const { data: newHouse, error: houseError } = await supabase
        .from('houses')
        .insert({
          rt_id: rt.id,
          owner_name: formData.fullName, // Temporary owner name
          house_number: formData.houseNumber,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude
        })
        .select('id')
        .single()
        
      if (houseError) throw new Error('Failed to create house: ' + houseError.message)
      houseId = newHouse.id
    }

    // 6. Check/Create Family
    let familyId: string
    const { data: existingFamily } = await supabase
      .from('families')
      .select('id')
      .eq('kk_number', formData.kk)
      .maybeSingle()

    if (existingFamily) {
      familyId = existingFamily.id
    } else {
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          house_id: houseId,
          kk_number: formData.kk,
          family_head_name: formData.fullName // Temporary head name
        })
        .select('id')
        .single()
        
      if (familyError) throw new Error('Failed to create family: ' + familyError.message)
      familyId = newFamily.id
    }

    // 7. Insert Citizen Profile
    const { error: profileError } = await supabase
      .from('citizen_profiles')
      .insert({
        id: user.id,
        family_id: familyId,
        nik: formData.nik,
        kk: formData.kk,
        phone: formData.phone,
        address: formData.address,
        rt: safeRtNumber,
        rw: safeRwNumber,
        gender: formData.gender,
        place_of_birth: formData.placeOfBirth,
        date_of_birth: formData.dateOfBirth,
        religion: formData.religion,
        occupation: formData.occupation,
        marital_status: formData.maritalStatus,
        verification_status: 'pending',
        documents: formData.documents
      })

    if (profileError) {
      // Basic rollback mechanism: We don't rollback houses/families in this lightweight flow,
      // as they might be shared or valid. But we must fail the request.
      throw new Error('Failed to create citizen profile: ' + profileError.message)
    }

    // 8. Log Activity
    await supabase.from('activity_logs').insert({
      profile_id: user.id,
      action: 'citizen_onboarding_completed',
      entity_type: 'citizen_profiles',
      entity_id: user.id,
      details: {
        step: 'completed',
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Onboarding Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
