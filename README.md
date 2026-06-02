# ZEUS – Essensuals | Website

Single-page, scroll-scrubbed 3D/parallax salon & spa website for **ZEUS – Essensuals**, Kollam, Kerala.

---

## How it works

The background is a **`<canvas>`** element fixed to the viewport. As the user scrolls a 500 vh "scroll track", 192 pre-extracted JPEG frames are drawn one-by-one — creating a smooth, cinematic video effect without any of the iOS Safari stutter caused by scrubbing a `<video>` element.

- **Desktop** (landscape) → loads `assets/frames/desktop/` frames
- **Mobile** (portrait) → loads `assets/frames/mobile/` frames
- Orientation change → automatically reloads the opposite frame set
- `prefers-reduced-motion` / frame-load failure → falls back to a looping `<video>` element

---

## Quick Start

### 1. Install ffmpeg (one-time)

| Platform | Command |
|---|---|
| Windows | Download from https://www.gyan.dev/ffmpeg/builds/ → add `bin/` to PATH |
| macOS | `brew install ffmpeg` |
| Ubuntu/WSL | `sudo apt install ffmpeg` |

### 2. Put the videos in place

Copy both source videos to:

```
zeus-salon/
└── assets/
    └── videos/
        ├── saloon-desktop.mp4   ← "saloon landing page video.mp4"
        └── saloon-mobile.mp4    ← "saloon landing page video for mobile.mp4"
```

### 3. Extract frames (removes Veo badge)

**Windows:**
```
extract-frames.bat
```

**Linux / macOS / WSL:**
```bash
chmod +x extract-frames.sh
./extract-frames.sh
```

This creates `assets/frames/desktop/frame_0001.jpg … frame_0192.jpg`  
and `assets/frames/mobile/frame_0001.jpg … frame_0192.jpg`.

### 4. Open the site

```bash
# Simple Python server (no install needed)
python -m http.server 8080
# → http://localhost:8080

# Or with Node
npx serve .
```

> ⚠️ The canvas frame loader uses relative paths, so it **must** be served over HTTP(S), not opened as a local `file://` URL.

---

## ⚠️ Google Maps Location — Client Must Confirm

The Google Maps link provided by the client points to **"Plasma Dental Care"** (coordinates 8.8897°N 76.5841°E). Those coordinates are used as a placeholder.

**To fix this:**
1. Ask the client for the correct ZEUS – Essensuals Google Maps link
2. In Google Maps, click **Share → Embed a map** to get a proper `<iframe>` embed URL
3. In `index.html`, find the `<iframe title="ZEUS Essensuals Location Map">` and replace its `src` attribute

---

## Swapping in the Real ZEUS Logo

1. Save your logo file as `assets/logo.svg` (SVG preferred) or `assets/logo.png`
2. In `index.html`, find every logo block (there are 3 — left header, right header, footer):

```html
<!-- BEFORE -->
<span class="logo-zeus">ZEUS</span>
<span class="logo-sub">ESSENSUALS</span>

<!-- AFTER -->
<img src="assets/logo.svg" alt="ZEUS Essensuals" class="logo-img">
```

3. Add to `css/style.css`:

```css
.logo-img {
  height: 38px;
  width: auto;
  object-fit: contain;
}
```

---

## Adjusting the Veo Watermark Removal

The Veo badge lives in the bottom-right corner of both videos. The extraction scripts remove it with ffmpeg's `delogo` filter (intelligent pixel interpolation) — falling back to `drawbox` (solid fill) if `delogo` isn't available.

**If the badge isn't fully removed:**

1. Run extraction with `show=1` instead of `show=0` to see a green rectangle:
   - In `extract-frames.bat`: change `show=0` → `show=1` in the ffmpeg command
   - Re-run → open any extracted frame → the green box shows the masked region
2. Adjust `DX / DY / DW / DH` (desktop) or `MX / MY / MW / MH` (mobile) until the box covers the badge
3. Change back to `show=0` and re-run

---

## Updating Contact Details

All contact info is in `index.html` → `#contact` section. Search and replace:

| What | Value |
|---|---|
| Phone / WhatsApp | `9645453585` |
| Email | `rajayyaps@gmail.com` |
| Owner name | `Rajesh Ayyappan` |

---

## Performance Tuning

| Setting | Where | Default | Lighter option |
|---|---|---|---|
| JPEG quality | `extract-frames.bat/.sh` → `QUALITY` | `4` | `5` (slightly smaller files) |
| Frame count | `js/main.js` → `CONFIG.FRAME_STEP` | `1` (192 frames) | `2` (96 frames, ~half the data) |
| Scroll height | `js/main.js` → `CONFIG.SCROLL_VH` | `500` | lower = faster scroll-through |

Approximate payload:
- Desktop 192 frames @ q=4 ≈ 12–18 MB
- Mobile  192 frames @ q=4 ≈ 6–10 MB

---

## Deployment

The site is a static bundle. Deploy the entire `zeus-salon/` folder to:

- **Netlify** — drag-and-drop `zeus-salon/` in the Netlify dashboard
- **Vercel** — `vercel deploy` from the project root
- **GitHub Pages** — push to a repo and enable Pages from `main` branch

---

## Items Needing Client Input

| # | Item | Status |
|---|---|---|
| 1 | Correct Google Maps location for ZEUS salon | ⚠️ Pending |
| 2 | Real ZEUS logo file (SVG or high-res PNG) | ⚠️ Pending |
| 3 | Confirm / update phone, email, and owner name if different | ✅ Provided |
