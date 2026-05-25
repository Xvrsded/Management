import type { SupabaseClient } from '@supabase/supabase-js'

export type HouseRow = {
  id: string
  owner_name: string
  house_number: string
  address: string
  latitude: number | null
  longitude: number | null
  created_at: string
  profile_id: string | null
}

const HOUSE_COLUMNS =
  'id, owner_name, house_number, address, latitude, longitude, created_at, profile_id' as const

const PAGE_LIMIT = 200

export async function fetchHouses(supabase: SupabaseClient): Promise<HouseRow[]> {
  const { data, error } = await supabase
    .from('houses')
    .select(HOUSE_COLUMNS)
    .order('house_number', { ascending: true })
    .limit(PAGE_LIMIT)

  if (error) throw error
  return data ?? []
}

export async function createHouse(
  supabase: SupabaseClient,
  payload: {
    ownerName: string
    houseNumber: string
    address: string
    latitude: number | null
    longitude: number | null
    profileId?: string | null
  }
): Promise<void> {
  const { error } = await supabase.from('houses').insert({
    owner_name: payload.ownerName,
    house_number: payload.houseNumber,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    profile_id: payload.profileId ?? null,
  })

  if (error) throw error
}
