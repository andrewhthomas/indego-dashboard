import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HourHeatmap } from "@/components/charts/hour-heatmap";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DAY_LABELS,
  formatHour,
  formatIsoDate,
  tripPatterns,
} from "@/lib/trip-patterns";

const FULL_DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const BAR_SIZE = 14;
const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Single-line station label for horizontal bar charts. Recharts' default tick
// wraps long names onto a second line, which collides with the next row.
function StationTick({
  x,
  y,
  payload,
  maxChars,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  maxChars: number;
}) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" className="fill-muted-foreground">
      <title>{payload?.value}</title>
      {truncate(payload?.value ?? "", maxChars)}
    </text>
  );
}

function PatternCard({
  title,
  metric,
  note,
  children,
}: {
  title: string;
  metric: string;
  note: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">{metric}</span>
        </div>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const hourlyConfig = {
  weekday: { label: "Weekday", color: "var(--color-chart-1)" },
  weekend: { label: "Weekend", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const riderConfig = {
  members: { label: "Members", color: "var(--color-chart-1)" },
  casual: { label: "Casual", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const monthlyConfig = {
  electric: { label: "Electric", color: "var(--color-chart-1)" },
  standard: { label: "Classic", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const commuterConfig = {
  net: { label: "Net bikes per weekday morning" },
} satisfies ChartConfig;

const stationConfig = {
  trips: { label: "Trips per day", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function PatternsView() {
  const { meta, hourly, dowHour, monthly, commuter, busiestStations, riders } =
    tripPatterns;
  const { bikes } = tripPatterns;
  const isMobile = useIsMobile();
  const labelWidth = isMobile ? 120 : 200;
  const labelChars = isMobile ? 17 : 30;

  const hourlyData = hourly.weekday.map((weekday, hour) => ({
    hour,
    weekday,
    weekend: hourly.weekend[hour],
  }));

  const riderHourly = riders.members.hourlyShare.map((members, hour) => ({
    hour,
    members,
    casual: riders.casual.hourlyShare[hour],
  }));

  const commuterData = [
    ...commuter.exporters,
    ...commuter.importers.slice().reverse(),
  ];

  const stationData = busiestStations.map((station) => ({
    name: station.name,
    trips: Math.round(station.starts + station.ends),
  }));

  const monthlyData = monthly.map((m) => ({
    ...m,
    // "Jan 25": the data spans more than one year
    label: formatIsoDate(`${m.month}-01`, { month: "short", year: "2-digit" }),
  }));

  const riderRows = [
    { label: "Members", sub: "Indego30 + Indego365", ...riders.members },
    { label: "Casual", sub: "Day Pass + Walk-up", ...riders.casual },
  ];
  const riderTrips = riders.members.trips + riders.casual.trips;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usage Patterns</h2>
        <p className="text-muted-foreground">
          {meta.totalTrips.toLocaleString()} trips from{" "}
          {formatIsoDate(meta.firstDate, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          to{" "}
          {formatIsoDate(meta.lastDate, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          . Times are Philadelphia local time.
        </p>
      </div>

      <PatternCard
        title="The week at a glance"
        metric="avg trips started, by day and hour"
        note="Each cell is one hour of one weekday, averaged over the whole period. Darker means more trips. Weekdays show two commute peaks; weekends build to a single afternoon hump."
      >
        <HourHeatmap
          unit="trips"
          rows={dowHour.map((values, day) => ({
            label: DAY_LABELS[day],
            values,
          }))}
        />
      </PatternCard>

      <PatternCard
        title="Weekday vs weekend"
        metric="avg trips started per hour"
        note="The same data as two lines, so the shapes can be compared directly. Read the height as trips in a typical hour of that kind of day."
      >
        <ChartContainer
          config={hourlyConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <LineChart data={hourlyData} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={2}
              tickFormatter={formatHour}
            />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    formatHour(Number(payload?.[0]?.payload.hour))
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
            <Line
              dataKey="weekday"
              stroke="var(--color-weekday)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="weekend"
              stroke="var(--color-weekend)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </PatternCard>

      <PatternCard
        title="Morning commuter signature"
        metric="arrivals minus departures, weekdays 7 to 9am"
        note={
          <>
            Net bikes gained or lost per weekday morning, from actual trips.{" "}
            <span className="font-medium text-foreground">Red</span> stations
            send riders out (residential blocks);{" "}
            <span className="font-medium text-foreground">blue</span> stations
            receive them (job and campus centers). Shows the ten strongest of
            each. Rebalancing trucks are not in the trip data, so this is rider
            demand, not the dock count you would see.
          </>
        }
      >
        <ChartContainer
          config={commuterConfig}
          className="aspect-auto w-full"
          style={{ height: commuterData.length * 26 + 40 }}
        >
          <BarChart
            data={commuterData}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={labelWidth}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<StationTick maxChars={labelChars} />}
            />
            <ReferenceLine x={0} stroke="var(--color-border)" />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  formatter={(_, __, item) => (
                    <div className="grid gap-0.5">
                      <span>
                        Net{" "}
                        <span className="font-mono font-medium">
                          {item.payload.net > 0 ? "+" : ""}
                          {item.payload.net}
                        </span>{" "}
                        bikes per morning
                      </span>
                      <span className="text-muted-foreground">
                        {item.payload.arrivals} arrive,{" "}
                        {item.payload.departures} leave
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="net" barSize={BAR_SIZE} radius={[0, 4, 4, 0]}>
              {commuterData.map((station) => (
                <Cell
                  key={station.id}
                  fill={
                    station.net < 0
                      ? "var(--color-chart-loss)"
                      : "var(--color-chart-gain)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </PatternCard>

      <PatternCard
        title="Busiest stations"
        metric="trips starting or ending there, per day"
        note="The fifteen stations that handle the most trips, counting both pickups and returns, averaged over every day in the data."
      >
        <ChartContainer
          config={stationConfig}
          className="aspect-auto w-full"
          style={{ height: stationData.length * 26 + 40 }}
        >
          <BarChart
            data={stationData}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={labelWidth}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<StationTick maxChars={labelChars} />}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="trips"
              fill="var(--color-trips)"
              barSize={BAR_SIZE}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </PatternCard>

      <PatternCard
        title="When the busiest stations are busy"
        metric="avg weekday trips started per hour"
        note="The same fifteen stations, by hour of a typical weekday. A station that is dark at 8am and light at 5pm is where people start their commute; the reverse is where they end it."
      >
        <HourHeatmap
          unit="trips started"
          labelClassName="w-40"
          rows={busiestStations.map((station) => ({
            label: station.name,
            values: station.weekdayHourly,
          }))}
        />
      </PatternCard>

      <PatternCard
        title="Seasonality"
        metric="avg trips per day, by month"
        note="Total daily ridership each month, split by bike type. The full bar is the system total; the split shows how much of it rides on electric bikes."
      >
        <ChartContainer
          config={monthlyConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart data={monthlyData} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
            <Bar
              dataKey="electric"
              stackId="trips"
              fill="var(--color-electric)"
              stroke="var(--color-card)"
              strokeWidth={2}
              maxBarSize={24}
            />
            <Bar
              dataKey="standard"
              stackId="trips"
              fill="var(--color-standard)"
              stroke="var(--color-card)"
              strokeWidth={2}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </PatternCard>

      <PatternCard
        title="Members vs casual riders"
        metric="share of each group's trips, by hour"
        note="Each line adds up to 100% of that group's trips, so the two can be compared even though members take far more rides. Members peak at commute hours; casual riders peak in the afternoon."
      >
        <ChartContainer
          config={riderConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <LineChart data={riderHourly} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={2}
              tickFormatter={formatHour}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value: number) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    formatHour(Number(payload?.[0]?.payload.hour))
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} itemSorter={null} />
            <Line
              dataKey="members"
              stroke="var(--color-members)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="casual"
              stroke="var(--color-casual)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>

        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Rider type</TableHead>
              <TableHead className="text-right">Share of trips</TableHead>
              <TableHead className="text-right">Median trip</TableHead>
              <TableHead className="text-right">Round trips</TableHead>
              <TableHead className="text-right">On e-bikes</TableHead>
              <TableHead className="text-right">On weekends</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {riderRows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>
                  <div className="font-medium">{row.label}</div>
                  <div className="text-xs text-muted-foreground">{row.sub}</div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {Math.round((row.trips / riderTrips) * 100)}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.medianDuration} min
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.roundTripShare}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.electricShare}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.weekendShare}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PatternCard>

      <PatternCard
        title="Hardest-working bikes"
        metric="trips per bike, on days it was ridden"
        note="How many trips a bike takes on a day it leaves the dock at least once. Days a bike sat unused or was out for repair are not counted, so this measures how hard the fleet works when it is in service."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Electric", bikes.electric],
              ["Classic", bikes.standard],
            ] as const
          ).map(([label, fleet]) => (
            <div key={label} className="rounded-lg border p-4">
              <p className="text-sm font-medium">{label} bikes</p>
              <p className="font-mono text-2xl font-bold">
                {fleet.tripsPerActiveDay.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">
                trips per day ridden · {fleet.bikes.toLocaleString()} bikes ·{" "}
                {fleet.trips.toLocaleString()} trips
              </p>
            </div>
          ))}
        </div>

        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Bike</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Days ridden</TableHead>
              <TableHead className="text-right">Trips per day ridden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bikes.top.map((bike) => (
              <TableRow key={bike.id}>
                <TableCell className="font-medium font-mono tabular-nums">
                  #{bike.id}
                </TableCell>
                <TableCell>
                  {bike.type === "electric" ? "Electric" : "Classic"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {bike.trips.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {bike.activeDays}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {(bike.trips / bike.activeDays).toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PatternCard>

      <p className="text-sm text-muted-foreground">
        Busiest single day: {FULL_DAY_LABELS[dayIndex(meta.busiestDay.date)]},{" "}
        {formatIsoDate(meta.busiestDay.date, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}{" "}
        with {meta.busiestDay.trips.toLocaleString()} trips. Source: Indego
        quarterly trip data.
      </p>
    </div>
  );
}

/** Monday-first weekday index for an ISO date */
function dayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
