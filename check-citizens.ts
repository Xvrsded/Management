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

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,full_name,role`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  })

  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Response:', text)
}

run()
