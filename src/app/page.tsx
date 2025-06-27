import { Dashboard } from '@/components/Dashboard'
import { AuthGuard } from '@/components/AuthGuard'

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}
