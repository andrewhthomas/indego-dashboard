"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const description = "An interactive area chart for daily trips";

interface DailyTripChartProps {
  data?: Array<{
    date: string;
    trips: number;
  }>;
}

const defaultChartData = [
  { date: "2024-04-01", trips: 372 },
  { date: "2024-04-02", trips: 277 },
  { date: "2024-04-03", trips: 287 },
  { date: "2024-04-04", trips: 502 },
  { date: "2024-04-05", trips: 663 },
  { date: "2024-04-06", trips: 641 },
  { date: "2024-04-07", trips: 425 },
  { date: "2024-04-08", trips: 729 },
  { date: "2024-04-09", trips: 169 },
  { date: "2024-04-10", trips: 451 },
  { date: "2024-04-11", trips: 677 },
  { date: "2024-04-12", trips: 502 },
  { date: "2024-04-13", trips: 722 },
  { date: "2024-04-14", trips: 357 },
  { date: "2024-04-15", trips: 290 },
  { date: "2024-04-16", trips: 328 },
  { date: "2024-04-17", trips: 806 },
  { date: "2024-04-18", trips: 774 },
  { date: "2024-04-19", trips: 423 },
  { date: "2024-04-20", trips: 239 },
  { date: "2024-04-21", trips: 337 },
  { date: "2024-04-22", trips: 394 },
  { date: "2024-04-23", trips: 368 },
  { date: "2024-04-24", trips: 677 },
  { date: "2024-04-25", trips: 465 },
  { date: "2024-04-26", trips: 205 },
  { date: "2024-04-27", trips: 803 },
  { date: "2024-04-28", trips: 302 },
  { date: "2024-04-29", trips: 555 },
  { date: "2024-04-30", trips: 834 },
  { date: "2024-05-01", trips: 385 },
  { date: "2024-05-02", trips: 603 },
  { date: "2024-05-03", trips: 437 },
  { date: "2024-05-04", trips: 805 },
  { date: "2024-05-05", trips: 871 },
  { date: "2024-05-06", trips: 1018 },
  { date: "2024-05-07", trips: 688 },
  { date: "2024-05-08", trips: 359 },
  { date: "2024-05-09", trips: 407 },
  { date: "2024-05-10", trips: 623 },
  { date: "2024-05-11", trips: 605 },
  { date: "2024-05-12", trips: 437 },
  { date: "2024-05-13", trips: 357 },
  { date: "2024-05-14", trips: 938 },
  { date: "2024-05-15", trips: 853 },
  { date: "2024-05-16", trips: 738 },
  { date: "2024-05-17", trips: 919 },
  { date: "2024-05-18", trips: 665 },
  { date: "2024-05-19", trips: 415 },
  { date: "2024-05-20", trips: 407 },
  { date: "2024-05-21", trips: 222 },
  { date: "2024-05-22", trips: 201 },
  { date: "2024-05-23", trips: 542 },
  { date: "2024-05-24", trips: 514 },
  { date: "2024-05-25", trips: 451 },
  { date: "2024-05-26", trips: 383 },
  { date: "2024-05-27", trips: 880 },
  { date: "2024-05-28", trips: 423 },
  { date: "2024-05-29", trips: 208 },
  { date: "2024-05-30", trips: 620 },
  { date: "2024-05-31", trips: 408 },
  { date: "2024-06-01", trips: 378 },
  { date: "2024-06-02", trips: 880 },
  { date: "2024-06-03", trips: 263 },
  { date: "2024-06-04", trips: 819 },
  { date: "2024-06-05", trips: 228 },
  { date: "2024-06-06", trips: 544 },
  { date: "2024-06-07", trips: 693 },
  { date: "2024-06-08", trips: 705 },
  { date: "2024-06-09", trips: 918 },
  { date: "2024-06-10", trips: 355 },
  { date: "2024-06-11", trips: 242 },
  { date: "2024-06-12", trips: 912 },
  { date: "2024-06-13", trips: 211 },
  { date: "2024-06-14", trips: 806 },
  { date: "2024-06-15", trips: 657 },
  { date: "2024-06-16", trips: 681 },
  { date: "2024-06-17", trips: 995 },
  { date: "2024-06-18", trips: 277 },
  { date: "2024-06-19", trips: 631 },
  { date: "2024-06-20", trips: 858 },
  { date: "2024-06-21", trips: 379 },
  { date: "2024-06-22", trips: 587 },
  { date: "2024-06-23", trips: 1010 },
  { date: "2024-06-24", trips: 312 },
  { date: "2024-06-25", trips: 331 },
  { date: "2024-06-26", trips: 814 },
  { date: "2024-06-27", trips: 938 },
  { date: "2024-06-28", trips: 349 },
  { date: "2024-06-29", trips: 263 },
  { date: "2024-06-30", trips: 846 },
];

const chartConfig = {
  trips: {
    label: "Daily Trips",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function DailyTripChart({ data }: DailyTripChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const chartData = data || defaultChartData;
  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-foreground">Daily Bike Trips</CardTitle>
          <CardDescription className="text-muted-foreground">
            Total trips taken per day over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTrips" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-trips)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-trips)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="trips"
              type="natural"
              fill="url(#fillTrips)"
              stroke="var(--color-trips)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
