import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PatternsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usage Patterns</h2>
          <p className="text-muted-foreground">
            Temporal and seasonal usage patterns analysis
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Patterns</CardTitle>
              <CardDescription>
                Usage distribution throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Hourly pattern chart coming soon
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Patterns</CardTitle>
              <CardDescription>Usage patterns by day of week</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Weekly pattern chart coming soon
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Trends</CardTitle>
            <CardDescription>
              Long-term usage trends and seasonal variations
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
            Seasonal trends visualization coming soon
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
