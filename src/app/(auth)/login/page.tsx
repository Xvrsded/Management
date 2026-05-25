import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import LoginFormSkeleton from '@/components/auth/LoginFormSkeleton'

export const metadata = {
  title: 'Masuk — RT/RW Digital',
  description: 'Masuk ke sistem administrasi warga RT/RW',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
