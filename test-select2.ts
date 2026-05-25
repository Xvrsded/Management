import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '')
    env[key] = val
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

async function testSelect() {
  const query = `
    select column_name
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'letter_requests';
  `
  // I cannot execute arbitrary SQL without service role or rpc, so I'll try to just select * from letter_requests?limit=1 with no headers and see if I can get headers, but postgrest doesn't return headers if array is empty.
  // Instead, I'll send an insert with only the minimal fields required by an old version of the table!
  const newRequest = {
    profile_id: '84a0d993-9c84-4860-9118-a62174152778',
    letter_type: 'surat_pengantar',
    purpose: 'Test',
    status: 'pending_rt',
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/letter_requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(newRequest)
  })

  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Response:', text)
}

testSelect()
