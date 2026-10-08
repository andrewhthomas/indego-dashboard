import { useEffect, useState } from "react";
import {
  Activity,
  Bike,
  Brain,
  CircleParking,
  Gauge,
  MapPin,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchStationStatus, type Station } from "@/lib/api";
import {
  computeLiveOverview,
  percentOfActive,
  type LiveOverview as Overview,
} from "@/lib/station-stats";

const REFRESH_MS = 30000;
const LIST_PREVIEW = 8;

function StationList({
  title,
  icon: Icon,
  stations,
  countLabel,
  emptyMessage,
  loading,
}: {
  title: string;
  icon: LucideIcon;
  stations: Station[];
  countLabel: string;
  emptyMessage: string;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? stations : stations.slice(0, LIST_PREVIEW);
  const hidden = stations.length - visible.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription>
          {loading ? "Loading..." : `${stations.length} ${countLabel}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!loading && stations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {visible.map((station) => (
              <li
                key={station.id}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="truncate font-medium">{station.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {station.totalDocks} docks
                </span>
              </li>
            ))}
          </ul>
        )}
        {(hidden > 0 || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full rounded-md py-1 text-center text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {expanded ? "Show fewer" : `+${hidden} more`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function LiveOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stations = await fetchStationStatus();
      if (stations.length > 0) {
        setOverview(computeLiveOverview(stations));
        setUpdatedAt(new Date());
      }
      setLoading(false);
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const pending = loading ? "Loading..." : "Unavailable";

  const statCards = [
    {
      title: "Available Bikes",
      value: overview?.bikes.toLocaleString() ?? "--",
      icon: Bike,
      description: overview ? "Ready to ride" : pending,
      color: "text-green-600",
    },
    {
      title: "Active Stations",
      value: overview
        ? `${overview.activeStations}/${overview.totalStations}`
        : "--",
      icon: MapPin,
      description: overview ? "Stations online" : pending,
      color: "text-blue-600",
    },
    {
      title: "Open Docks",
      value: overview?.openDocks.toLocaleString() ?? "--",
      icon: Activity,
      description: overview ? "Parking spots" : pending,
      color: "text-purple-600",
    },
    {
      title: "Fill",
      value: overview ? `${overview.fillPercent}%` : "--",
      icon: Gauge,
      description: overview ? "Bikes ÷ dock capacity" : pending,
      color: "text-orange-600",
    },
  ];

  const callouts = [
    {
      title: "Hard to find a bike",
      icon: Bike,
      count: overview?.empty.length,
      detail: "of stations are empty",
    },
    {
      title: "Hard to return a bike",
      icon: CircleParking,
      count: overview?.full.length,
      detail: "of stations are full",
    },
    {
      title: "Strained right now",
      icon: TriangleAlert,
      count: overview?.strained,
      detail: "have at most 1 bike or 1 open dock",
    },
  ];

  const bikeTypes = [
    {
      title: "Classic Bikes",
      value: overview?.classicBikes,
      icon: Bike,
      color: "text-gray-600",
    },
    {
      title: "Electric Bikes",
      value: overview?.electricBikes,
      icon: Zap,
      color: "text-yellow-600",
    },
    {
      title: "Smart Bikes",
      value: overview?.smartBikes,
      icon: Brain,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {updatedAt
          ? `Live across all stations · updated ${updatedAt.toLocaleTimeString()} · refreshes every 30 seconds`
          : loading
            ? "Loading live station data..."
            : "Live station data is unavailable right now."}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {callouts.map((callout) => (
          <Card key={callout.title}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 font-medium">
                <callout.icon className="h-4 w-4" />
                {callout.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview && callout.count !== undefined
                  ? `${percentOfActive(callout.count, overview)}%`
                  : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {overview && callout.count !== undefined
                  ? `${callout.detail} (${callout.count} of ${overview.activeStations})`
                  : pending}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StationList
          title="Needs bikes now"
          icon={Bike}
          stations={overview?.empty ?? []}
          countLabel="empty"
          emptyMessage="No empty stations right now."
          loading={!overview}
        />
        <StationList
          title="Needs docks now"
          icon={CircleParking}
          stations={overview?.full ?? []}
          countLabel="full"
          emptyMessage="No full stations right now."
          loading={!overview}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bike Types Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {bikeTypes.map((bike) => (
              <div
                key={bike.title}
                className="flex items-center gap-3 rounded-lg border p-4"
              >
                <bike.icon className={`h-5 w-5 ${bike.color}`} />
                <div>
                  <p className="text-sm font-medium">{bike.title}</p>
                  <p className="text-2xl font-bold">
                    {bike.value?.toLocaleString() ?? "--"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {overview && (
            <div className="mt-4 text-sm text-muted-foreground">
              Total bikes in system: {overview.bikes.toLocaleString()} across{" "}
              {overview.totalStations} stations
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
