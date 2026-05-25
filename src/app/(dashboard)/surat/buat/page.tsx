import { redirect } from 'next/navigation'

export default function BuatSuratPage() {
  // Automatically redirect citizens back to the unified parent dashboard with search parameters
  // to open the modern modal overlay locally on the same page.
  redirect('/surat?action=new')
}
