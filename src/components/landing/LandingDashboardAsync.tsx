import { getLandingDashboardData } from '@/services/landingService.server'
import LandingDashboardPreview from './LandingDashboardPreview'

export default async function LandingDashboardAsync() {
  const data = await getLandingDashboardData()
  return <LandingDashboardPreview data={data} />
}
