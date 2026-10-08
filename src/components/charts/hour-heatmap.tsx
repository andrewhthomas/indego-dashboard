import { useState } from "react";
import { formatHour } from "@/lib/trip-patterns";

export interface HeatmapRow {
  label: string;
  /** One value per hour of day, index 0-23 */
  values: number[];
}

interface HourHeatmapProps {
  rows: HeatmapRow[];
  /** e.g. "trips" -> "Tue 5pm: 455 trips" */
  unit: string;
  /** Tailwind width class for the row-label column */
  labelClassName?: string;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** Rows × hour-of-day grid, one sequential hue: darker means more. */
export function HourHeatmap({
  rows,
  unit,
  labelClassName = "w-12",
}: HourHeatmapProps) {
  const [hovered, setHovered] = useState<{ row: number; hour: number } | null>(
    null,
  );
  const max = Math.max(...rows.flatMap((row) => row.values));
  const describe = (row: HeatmapRow, hour: number) =>
    `${row.label}, ${formatHour(hour)}: ${row.values[hour].toLocaleString()} ${unit}`;

  return (
    <div>
      <p className="mb-2 h-5 text-sm" aria-live="polite">
        {hovered ? (
          <span className="font-mono font-medium tabular-nums">
            {describe(rows[hovered.row], hovered.hour)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Hover a cell to see its value
          </span>
        )}
      </p>
      {/* relative: keeps the sr-only cell labels inside the scroll area */}
      <div className="relative overflow-x-auto">
        <table
          className="w-full min-w-[560px] table-fixed border-separate border-spacing-[2px] text-xs"
          onMouseLeave={() => setHovered(null)}
        >
          <thead>
            <tr>
              <th className={labelClassName} />
              {HOURS.map((hour) => (
                <th
                  key={hour}
                  scope="col"
                  className="overflow-visible whitespace-nowrap text-left font-normal text-muted-foreground"
                >
                  {hour % 3 === 0 ? formatHour(hour) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className={`${labelClassName} truncate pr-2 text-right font-normal text-muted-foreground`}
                  title={row.label}
                >
                  {row.label}
                </th>
                {row.values.map((value, hour) => (
                  <td
                    key={hour}
                    className="h-6 rounded-[3px] p-0"
                    style={{
                      backgroundColor: `color-mix(in oklab, var(--color-chart-1) ${Math.round((value / max) * 100)}%, var(--color-muted))`,
                      outline:
                        hovered?.row === rowIndex && hovered.hour === hour
                          ? "2px solid var(--color-foreground)"
                          : undefined,
                    }}
                    onMouseEnter={() => setHovered({ row: rowIndex, hour })}
                  >
                    <span className="sr-only">{describe(row, hour)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>0</span>
        <div
          className="h-2 w-32 rounded-full"
          style={{
            background:
              "linear-gradient(to right, var(--color-muted), var(--color-chart-1))",
          }}
        />
        <span>
          {Math.round(max).toLocaleString()} {unit}
        </span>
      </div>
    </div>
  );
}
