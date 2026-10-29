# Portfolio review checkpoint

Base: https://github.com/srijansworks/portfolio-site at `6eb25ae`.
Branch: `revamp/engineering-previews`. No new commits, pushes, or deployments.

## Local preview and source

`python3 -m http.server 8765 --bind 127.0.0.1` from this checkout serves the static preview. `npm run build` regenerates accessible HTML; `npm run check` verifies links, counter API failure behavior, crosshair controls, and the complete typewriter sequence.

The Python static server does not run Vercel API functions. The visit widget therefore clearly displays a configured starting value while backend setup is pending.

## Current implementation

- Readable light design, sticky contact links, toolkit above six selected projects, and eight static project destinations plus the preserved original Scene demo.
- Touching 30px hero circles: a faster six-second diagonal wave fills each circle, hollows its center into a green ring, and quickly fades. Reduced-motion uses a static fallback; off-screen effects pause.
- AKA line cycles all ten user-provided aliases with character-by-character typing/deletion and a teal cursor.
- Orange crosshair for every project card and additional work link. Random visible acquisition, overshoot, correction, lock, and uniform smooth zoom take 920ms. No WebGL or models are used for navigation. Escape cancels, Skip navigates, and modified/reduced-motion clicks retain normal link behavior.
- All lamp code and assets were removed from the served site at the user's request. Prior work is retained only under the excluded `source/archive/lamp/` folder. The name is normal text again.
- Human-tracking drone: approved 15-second real recording and poster. PID: original simulator code. Maritime: original three-drone shared-map playback. Lunar RL: existing successful PPO and crashing random-policy recordings, correctly labeled, plus original results.
- WIP pan/tilt system: new user-provided `IMG_0590.mov` is shown as a 16.29-second muted H.264 preview (480×854, 24fps, 1,395,996 bytes) with poster. The original is unchanged. Caption identifies it as bench servo footage. Build notes now say successful OpenCV tracking of the Tello and a rough servo-motion setup. Exact original Now / Building / Next up notes are preserved.
- ArUco mapping removed; concise drums section with supplied scholarship/earnings figures; real click-to-load Calendly calendar verified.

## Dedicated visit counter

No connection to BuildBase. The user has configured the separate `portfolio-visits` project at `https://pakijvtgycmiabkipfgf.supabase.co` and confirmed the SQL returned 327. Instructions are delivered in `PORTFOLIO-COUNTER-SETUP.md` and the accompanying `portfolio-visits.sql`.

First counted homepage load displays 327; the next 328. Counts visits, including reloads, not unique people or people online. 327 is a configured starting number, not historical analytics. One atomic PostgreSQL update records each arrival. The browser only calls the Vercel function; the Supabase secret remains server-only.

Required Production variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VISIT_COUNTER_LABEL_APPROVED=true`. Preview/Development counting stays disabled. The user confirmed the migration and Production variables are configured in Vercel project `srijansaha`; Preview and Development have no counter variables. The agent made no remote migration, project creation, or environment mutation. The authenticated dashboard and live function have not been independently verified. Activation awaits the first approved deployment.

The SQL passed isolated in-memory PostgreSQL checks for initial/first/next values, exact increments, anonymous/authenticated denial, service-role RPC access, and idempotent migration. No external database was accessed. `source/verify-counter.mjs` performs a read-only connection test once a private environment file is available.

## Review gate

The local preview is ready for continued visual review. No commit or push was made because the existing Vercel integration may deploy on push. Setup is user-confirmed. The separate counter will receive a read-only live check after the first approved deployment; deployment still awaits explicit approval.
