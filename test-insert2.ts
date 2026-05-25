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

async function testInsert() {
  const userId = '84a0d993-9c84-4860-9118-a62174152778' // Need a real valid user UUID

  const newRequest = {
    profile_id: userId,
    letter_type: 'surat_pengantar',
    purpose: 'Test',
    custom_fields: {},
    status: 'pending_rt',
    request_code: 'TEST-1234',
    support_document_url: 'http://test.com/doc.pdf'
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/letter_requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(newRequest)
  })

  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Response:', text)
}

testInsert()
