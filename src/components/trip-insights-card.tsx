import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatHour, formatIsoDate, tripPatterns } from "@/lib/trip-patterns";
import { TrendingUp, Clock, Route } from "lucide-react";

export function TripInsightsCard() {
  const { meta, window: recent } = tripPatterns;
  const monthYear = { month: "short", year: "numeric" } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Insights</CardTitle>
        <CardDescription>
          {meta.totalTrips.toLocaleString()} trips since{" "}
          {formatIsoDate(meta.firstDate, monthYear)}. Figures below are for the
          last 12 months ({formatIsoDate(recent.firstDate, monthYear)} to{" "}
          {formatIsoDate(recent.lastDate, monthYear)}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="font-mono text-xl font-bold">
              {recent.electricShare}%
            </div>
            <div className="text-xs text-muted-foreground">Electric</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="font-mono text-xl font-bold">
              {recent.avgDuration}
            </div>
            <div className="text-xs text-muted-foreground">Avg Min</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <Route className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="font-mono text-xl font-bold">
              {recent.avgTripsPerDay.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Daily Avg</div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Peak Hour:</span>
            <span className="font-mono tabular-nums font-medium">
              {formatHour(recent.peakHour)} to {formatHour(recent.peakHour + 1)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Busiest Day on Record:
            </span>
            <span className="font-mono tabular-nums font-medium">
              {formatIsoDate(meta.busiestDay.date, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              ({meta.busiestDay.trips.toLocaleString()} trips)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
