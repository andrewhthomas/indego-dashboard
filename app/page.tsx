import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStatsEnhanced } from "@/components/dashboard-stats-enhanced";
import { TripInsightsCard } from "@/components/trip-insights-card";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Philadelphia bike share system analytics and insights
          </p>
        </div>

        <DashboardStatsEnhanced />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Real-time System Status</CardTitle>
              <CardDescription>
                Current bike availability and distribution across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Live system analytics will be displayed here
            </CardContent>
          </Card>

          <TripInsightsCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
