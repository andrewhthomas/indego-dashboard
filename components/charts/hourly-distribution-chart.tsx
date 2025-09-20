"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface HourlyDistributionChartProps {
  data: Array<{
    hour: number;
    trips: number;
  }>;
}

const chartConfig = {
  trips: {
    label: "Trips",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function HourlyDistributionChart({
  data,
}: HourlyDistributionChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    hourLabel: `${item.hour.toString().padStart(2, "0")}:00`,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hourLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={1}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `Hour: ${label}`}
              indicator="dashed"
            />
          }
        />
        <Bar dataKey="trips" fill="var(--color-trips)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
