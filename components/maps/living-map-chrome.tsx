"use client";

import { Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatTimeReadout,
  formatDateReadout,
  addDaysIso,
} from "@/lib/living-map/scrubber-format";

const MS_PER_DAY = 24 * 3_600_000;

export type ScrubberProps = {
  currentDate: string;
  currentMs: number;
  playing: boolean;
  onCurrentMsChange: (ms: number) => void;
  onPlayToggle: () => void;
  onDateChange: (iso: string) => void;
  minDate: string;
  maxDate: string;
  /** Optional live signal from the map layer — e.g. "4,321 trips in flight". */
  statusText?: string;
};

export function Scrubber({
  currentDate,
  currentMs,
  playing,
  onCurrentMsChange,
  onPlayToggle,
  onDateChange,
  minDate,
  maxDate,
  statusText,
}: ScrubberProps) {
  const canGoPrev = currentDate > minDate;
  const canGoNext = currentDate < maxDate;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2",
        "flex w-[min(720px,92vw)] items-center gap-3",
        "rounded-full border border-white/10 bg-black/70 px-4 py-2.5",
        "text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "backdrop-blur-md",
      )}
      role="group"
      aria-label="Playback controls"
    >
      <button
        type="button"
        onClick={onPlayToggle}
        className={cn(
          "grid size-8 place-items-center rounded-full",
          "bg-[hsl(330_80%_60%)] text-black transition-opacity hover:opacity-90",
        )}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <div className="flex items-center gap-1 text-xs tabular-nums">
        <button
          type="button"
          onClick={() => canGoPrev && onDateChange(addDaysIso(currentDate, -1))}
          disabled={!canGoPrev}
          className="rounded p-1 text-white/70 hover:text-white disabled:opacity-30"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-[96px] text-center font-medium">
          {formatDateReadout(currentDate)}
        </div>
        <button
          type="button"
          onClick={() => canGoNext && onDateChange(addDaysIso(currentDate, 1))}
          disabled={!canGoNext}
          className="rounded p-1 text-white/70 hover:text-white disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={MS_PER_DAY - 1}
        step={60_000}
        value={currentMs}
        onChange={(e) => onCurrentMsChange(Number(e.target.value))}
        className="flex-1 cursor-pointer accent-[hsl(330_80%_60%)]"
        aria-label="Time of day"
      />

      <div className="min-w-[70px] text-right text-sm font-medium tabular-nums">
        {formatTimeReadout(currentMs)}
      </div>

      {statusText && (
        <div className="hidden min-w-[120px] text-right text-xs tabular-nums text-white/50 md:block">
          {statusText}
        </div>
      )}
    </div>
  );
}
