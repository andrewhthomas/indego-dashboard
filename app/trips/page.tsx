import { DashboardLayout } from "@/components/dashboard-layout"
import { TripsAnalytics } from "./trips-analytics"

export default function TripsPage() {
  return (
    <DashboardLayout>
      <TripsAnalytics />
    </DashboardLayout>
  )
}