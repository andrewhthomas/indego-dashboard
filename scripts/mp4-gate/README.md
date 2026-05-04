# Day -1 MP4 Audience Gate

Throwaway scratch folder. Renders a 15-second MP4 of one Philadelphia day of
Indego trip data so you can text it to 3 cyclist friends and see if they care
BEFORE spending 24 hours on the interactive deck.gl version.

This folder is in `.gitignore` and will be deleted after the audience gate resolves.

## Output

`indego-2025-09-20.mp4` — Saturday Sep 20, 2025 (6,072 trips, biggest Q3 weekend day).
~8MB, 1080x1080, 30fps.

## Regenerate

```bash
./venv/bin/python3 render.py
```

Change `TARGET_DATE` at the top of `render.py` to try a different day.

## Dependencies

- Python 3.14 (via homebrew)
- pandas, matplotlib, numpy (installed in `./venv/`)
- ffmpeg (system, via `brew install ffmpeg`)

## What's next

Text the MP4 to 3 Philly cyclist friends with exactly:

> "made this little thing, worth building into a real thing?"

Don't explain it. Don't sell it. Wait 24 hours.

- If they react: proceed to Day 1 integration per the eng-reviewed design doc.
- If they shrug: stop. Either ship the MP4 alone to Twitter, rethink the concept,
  or abandon. The whole gate exists to de-risk 24+ hours of implementation.
