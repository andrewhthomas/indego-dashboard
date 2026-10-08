import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRIP_INDEX, formatMonthKey } from "@/lib/trip-data";

interface PeriodFilterProps {
  /** "all", a year ("2025") or a month ("2025-06") */
  value: string;
  onValueChange: (value: string) => void;
}

const ALL = "all";
// Newest year first
const YEARS = TRIP_INDEX.years.slice().reverse();

export function PeriodFilter({ value, onValueChange }: PeriodFilterProps) {
  const year = value === ALL ? ALL : value.slice(0, 4);
  const month = value.includes("-") ? value : ALL;
  const months = YEARS.find((y) => y.year === year)?.months ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Period:</span>
      <Select value={year} onValueChange={onValueChange}>
        <SelectTrigger className="w-32" aria-label="Year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All years</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y.year} value={y.year}>
              {y.year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={month}
        onValueChange={(next) => onValueChange(next === ALL ? year : next)}
        disabled={year === ALL}
      >
        <SelectTrigger className="w-40" aria-label="Month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All months</SelectItem>
          {months.map((key) => (
            <SelectItem key={key} value={key}>
              {formatMonthKey(key).split(" ")[0]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
