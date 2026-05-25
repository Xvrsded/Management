import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key) env[key.trim()] = val.join('=').trim()
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  const userId = '00000000-0000-0000-0000-000000000000'

  const newRequest = {
    profile_id: userId,
    letter_type: 'surat_pengantar',
    purpose: 'Test',
    custom_fields: {},
    status: 'pending_rt',
    support_document_url: 'http://test.com/doc.pdf',
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('letter_requests')
    .insert(newRequest)
    .select()
    .single()

  if (error) {
    console.log('Error details:', JSON.stringify(error, null, 2))
    console.log('Message:', error.message)
    console.log('Code:', error.code)
    console.log('Details:', error.details)
    console.log('Hint:', error.hint)
  } else {
    console.log('Success:', data)
  }
}

testInsert()
