"""
Indego Living Map — Day -1 MP4 audience gate render.

Produces a 15-second MP4 of one full Philadelphia day of Indego trips,
compressed into 15 real seconds (~96 sim min per real sec).

Aesthetic: near-black background, vivid pink trails, subtle station dots.
Trip render: straight line from origin to destination, alpha ramps up over
the first sim-minute, then fades over 3 sim-min after trip ends.

Output: ./indego-2025-09-20.mp4 (~2-5MB, 1080x1080 @ 30fps).
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.collections import LineCollection
import numpy as np
from pathlib import Path

# -------- Config --------
HERE = Path(__file__).resolve().parent
CSV_PATH = HERE / "data" / "q3.csv"
TARGET_DATE = "2025-09-20"  # Saturday, 6,072 trips — biggest Q3 weekend
OUTPUT_MP4 = HERE / f"indego-{TARGET_DATE}.mp4"

FPS = 30
DURATION_SEC = 15
TOTAL_FRAMES = FPS * DURATION_SEC  # 450 frames for one simulated day

# Philly bounding box (tight enough to see detail, loose enough to include
# West Philly + Fishtown + Navy Yard)
LAT_MIN, LAT_MAX = 39.92, 40.02
LNG_MIN, LNG_MAX = -75.24, -75.10

# Aesthetic (matches indego-dashboard dark-mode palette)
BG = "#050505"
ACCENT_R, ACCENT_G, ACCENT_B = 236 / 255, 72 / 255, 153 / 255  # hsl(330 80% 60%) ish
STATION_COLOR = "#2a1520"
TEXT_COLOR = "#f0f0f0"
MUTED_TEXT = "#777"

# Trip render timing (in simulated seconds)
RAMP_UP_SEC = 60      # alpha ramps up over first 60 sim-sec of a trip
FADE_OUT_SEC = 180    # alpha fades over 180 sim-sec after trip ends
MAX_ALPHA = 0.75


def main():
    print(f"Loading {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH, low_memory=False)
    df["start_time"] = pd.to_datetime(
        df["start_time"], format="%m/%d/%Y %H:%M", errors="coerce"
    )
    df["end_time"] = pd.to_datetime(
        df["end_time"], format="%m/%d/%Y %H:%M", errors="coerce"
    )

    # Filter to target date + valid coords
    df = df[df["start_time"].dt.date.astype(str) == TARGET_DATE]
    df = df.dropna(
        subset=["start_time", "end_time", "start_lat", "start_lon", "end_lat", "end_lon"]
    )
    df = df[
        (df["start_lat"].between(LAT_MIN - 0.5, LAT_MAX + 0.5))
        & (df["start_lon"].between(LNG_MIN - 0.5, LNG_MAX + 0.5))
        & (df["end_lat"].between(LAT_MIN - 0.5, LAT_MAX + 0.5))
        & (df["end_lon"].between(LNG_MIN - 0.5, LNG_MAX + 0.5))
    ]
    print(f"  {len(df):,} trips on {TARGET_DATE}")

    # Canonical stations (for background scatter)
    stations = (
        pd.concat(
            [
                df[["start_station", "start_lat", "start_lon"]].rename(
                    columns={"start_station": "id", "start_lat": "lat", "start_lon": "lon"}
                ),
                df[["end_station", "end_lat", "end_lon"]].rename(
                    columns={"end_station": "id", "end_lat": "lat", "end_lon": "lon"}
                ),
            ]
        )
        .drop_duplicates("id")
        .reset_index(drop=True)
    )
    print(f"  {len(stations)} unique stations")

    # Trip arrays as unix seconds (naive-as-UTC). Robust to pandas 2.x vs 3.0
    # datetime unit differences (ns vs us) by using total_seconds() against epoch.
    EPOCH = pd.Timestamp("1970-01-01")
    day_start = pd.Timestamp(TARGET_DATE)
    day_end = day_start + pd.Timedelta(days=1)
    total_sim_seconds = (day_end - day_start).total_seconds()
    day_start_unix = int((day_start - EPOCH).total_seconds())

    trip_starts = (df["start_time"] - EPOCH).dt.total_seconds().astype("int64").values
    trip_ends = (df["end_time"] - EPOCH).dt.total_seconds().astype("int64").values
    s_lon = df["start_lon"].values
    s_lat = df["start_lat"].values
    e_lon = df["end_lon"].values
    e_lat = df["end_lat"].values

    # -------- Figure --------
    fig, ax = plt.subplots(figsize=(10, 10), facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_xlim(LNG_MIN, LNG_MAX)
    ax.set_ylim(LAT_MIN, LAT_MAX)
    # Mercator-ish correction: at Philly lat ~39.97°, 1° lng ≈ 0.767° lat in ground distance.
    # Setting aspect = 1/cos(lat) makes the map look geographically accurate instead of stretched.
    center_lat_rad = np.radians((LAT_MIN + LAT_MAX) / 2)
    ax.set_aspect(1 / np.cos(center_lat_rad))
    ax.axis("off")

    # Static station layer — brighter so it reads as the "bones" of the city
    ax.scatter(
        stations["lon"], stations["lat"],
        s=14, c="#4a2030", zorder=1, linewidth=0, alpha=0.9,
    )

    # Animated line collection — two stacked layers give a subtle glow effect
    # (wide soft layer behind, crisp bright layer on top)
    lines_glow = LineCollection([], colors=[], linewidths=4.0, zorder=2, capstyle="round")
    lines = LineCollection([], colors=[], linewidths=1.3, zorder=3, capstyle="round")
    ax.add_collection(lines_glow)
    ax.add_collection(lines)

    # Chrome: title, time readout, trip count
    fig.text(
        0.5, 0.93,
        f"Philadelphia · Indego · {pd.Timestamp(TARGET_DATE).strftime('%a %b %-d, %Y')}",
        color=TEXT_COLOR, fontsize=22, ha="center", fontweight="light",
    )
    fig.text(
        0.5, 0.895,
        "one day of bike share, compressed into 15 seconds",
        color=MUTED_TEXT, fontsize=10, ha="center", style="italic",
    )
    time_readout = fig.text(
        0.5, 0.05, "12:00 AM",
        color=f"#{int(ACCENT_R*255):02x}{int(ACCENT_G*255):02x}{int(ACCENT_B*255):02x}",
        fontsize=18, ha="center", family="monospace",
    )
    count_readout = fig.text(
        0.04, 0.04, "0 trips in flight",
        color=MUTED_TEXT, fontsize=11, ha="left", family="monospace",
    )

    # -------- Animation --------
    def render_frame(frame_idx):
        # Sim time for this frame
        sim_seconds = (frame_idx / max(TOTAL_FRAMES - 1, 1)) * total_sim_seconds
        sim_time = pd.Timestamp(TARGET_DATE) + pd.Timedelta(seconds=sim_seconds)
        now_unix = day_start_unix + sim_seconds

        # Active mask: trip started AND (still running OR still fading)
        active = (trip_starts <= now_unix) & (trip_ends >= now_unix - FADE_OUT_SEC)
        if not np.any(active):
            lines.set_segments([])
            lines.set_color([])
            lines_glow.set_segments([])
            lines_glow.set_color([])
            time_readout.set_text(sim_time.strftime("%-I:%M %p"))
            count_readout.set_text("0 trips in flight")
            return lines, lines_glow, time_readout, count_readout

        idx = np.where(active)[0]
        age = now_unix - trip_starts[idx]         # 0 or positive
        past_end = now_unix - trip_ends[idx]       # negative if still riding, positive if fading

        # Alpha: ramp up in first RAMP_UP_SEC, full during ride, fade out over FADE_OUT_SEC
        ramp = np.minimum(1.0, age / RAMP_UP_SEC)
        fade = np.where(past_end > 0, np.maximum(0.0, 1.0 - past_end / FADE_OUT_SEC), 1.0)
        alphas = np.clip(ramp * fade, 0.0, MAX_ALPHA)

        # Segments: one per active trip (origin -> destination)
        segs = np.stack(
            [
                np.column_stack([s_lon[idx], s_lat[idx]]),
                np.column_stack([e_lon[idx], e_lat[idx]]),
            ],
            axis=1,
        )
        rgba = np.tile([ACCENT_R, ACCENT_G, ACCENT_B, 1.0], (len(alphas), 1))
        rgba[:, 3] = alphas

        lines.set_segments(segs)
        lines.set_color(rgba)

        # Glow layer: same segments, dimmer + wider
        rgba_glow = rgba.copy()
        rgba_glow[:, 3] = alphas * 0.25
        lines_glow.set_segments(segs)
        lines_glow.set_color(rgba_glow)

        # In-flight count: trips currently riding (not fading)
        in_flight = int(((trip_starts <= now_unix) & (trip_ends > now_unix)).sum())
        time_readout.set_text(sim_time.strftime("%-I:%M %p"))
        count_readout.set_text(f"{in_flight:,} trips in flight")

        return lines, lines_glow, time_readout, count_readout

    print(f"Rendering {TOTAL_FRAMES} frames at {FPS}fps ({DURATION_SEC}s MP4)...")
    anim = animation.FuncAnimation(
        fig, render_frame, frames=TOTAL_FRAMES, interval=1000 / FPS, blit=False
    )

    writer = animation.FFMpegWriter(
        fps=FPS,
        bitrate=4000,
        codec="libx264",
        extra_args=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    )
    anim.save(str(OUTPUT_MP4), writer=writer, dpi=108)
    size_mb = OUTPUT_MP4.stat().st_size / 1024 / 1024
    print(f"  wrote {OUTPUT_MP4} ({size_mb:.1f}MB)")


if __name__ == "__main__":
    main()
