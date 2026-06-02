#!/usr/bin/env bash
# ============================================================
#  ZEUS – Essensuals  |  extract-frames.sh
#  Linux / macOS / WSL version
#
#  Extracts JPEG frame sequences from both salon videos and
#  removes the Veo AI-video watermark from the bottom-right
#  corner using ffmpeg's delogo filter.
#
#  REQUIREMENTS: ffmpeg (brew install ffmpeg  or  apt install ffmpeg)
#
#  USAGE:
#    1. Copy both videos into assets/videos/:
#         assets/videos/saloon-desktop.mp4
#         assets/videos/saloon-mobile.mp4
#    2. chmod +x extract-frames.sh && ./extract-frames.sh
#    3. Frames land in assets/frames/desktop/ and assets/frames/mobile/
#    4. Check the last few frames for Veo badge remnants;
#       adjust badge coordinates below if needed.
# ============================================================
set -euo pipefail

# ── Input videos ────────────────────────────────────────────
DESKTOP_VIDEO="assets/videos/saloon-desktop.mp4"
MOBILE_VIDEO="assets/videos/saloon-mobile.mp4"

# ── Output directories ──────────────────────────────────────
DESKTOP_OUT="assets/frames/desktop"
MOBILE_OUT="assets/frames/mobile"

# ── JPEG quality (2=best, 31=worst; 4-5 is a good balance) ─
QUALITY=4

# ── Veo badge coordinates — DESKTOP (1920×1080) ─────────────
# delogo: x=left edge, y=top edge, w=width, h=height (pixels)
# Change show=0 to show=1 to preview the mask as a green box.
DX=1668; DY=1008; DW=252; DH=72

# ── Veo badge coordinates — MOBILE (1080×1920) ──────────────
MX=935; MY=1836; MW=145; MH=84

# ════════════════════════════════════════════════════════════

echo ""
echo "  ┌──────────────────────────────────────────┐"
echo "  │  ZEUS – Essensuals  Frame Extractor       │"
echo "  │  Veo badge removal + JPEG export          │"
echo "  └──────────────────────────────────────────┘"
echo ""

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "  [ERROR] ffmpeg not found."
  echo "  Install: brew install ffmpeg  (macOS)"
  echo "           sudo apt install ffmpeg  (Ubuntu/WSL)"
  exit 1
fi

mkdir -p "$DESKTOP_OUT" "$MOBILE_OUT"

# ── Helper: extract with delogo, fall back to drawbox ───────
extract_frames() {
  local input="$1" output_dir="$2" scale="$3"
  local bx="$4" by="$5" bw="$6" bh="$7"

  echo "  Trying delogo filter (x=$bx y=$by w=$bw h=$bh)..."

  if ffmpeg -y -i "$input" \
       -vf "scale=${scale}:-1,delogo=x=${bx}:y=${by}:w=${bw}:h=${bh}:show=0" \
       -q:v $QUALITY \
       "${output_dir}/frame_%04d.jpg" 2>/dev/null; then
    echo "  ✓ delogo OK"
  else
    echo "  [WARN] delogo failed — using drawbox fallback (solid fill)"
    ffmpeg -y -i "$input" \
      -vf "scale=${scale}:-1,drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=#0a0a0a:t=fill" \
      -q:v $QUALITY \
      "${output_dir}/frame_%04d.jpg"
    echo "  ✓ drawbox OK"
  fi
}

# ── Step 1: Desktop ─────────────────────────────────────────
echo "  [1/2] DESKTOP frames (scale=1920px)..."
echo "        $DESKTOP_VIDEO → $DESKTOP_OUT/"
extract_frames "$DESKTOP_VIDEO" "$DESKTOP_OUT" 1920 $DX $DY $DW $DH
DCOUNT=$(ls -1 "${DESKTOP_OUT}"/frame_*.jpg 2>/dev/null | wc -l)
echo "        → $DCOUNT frames extracted"
echo ""

# ── Step 2: Mobile ──────────────────────────────────────────
echo "  [2/2] MOBILE frames (scale=1080px)..."
echo "        $MOBILE_VIDEO → $MOBILE_OUT/"
extract_frames "$MOBILE_VIDEO" "$MOBILE_OUT" 1080 $MX $MY $MW $MH
MCOUNT=$(ls -1 "${MOBILE_OUT}"/frame_*.jpg 2>/dev/null | wc -l)
echo "        → $MCOUNT frames extracted"
echo ""

# ── Copy videos for fallback player ─────────────────────────
cp -n "$DESKTOP_VIDEO" "assets/videos/saloon-desktop.mp4" 2>/dev/null || true
cp -n "$MOBILE_VIDEO"  "assets/videos/saloon-mobile.mp4"  2>/dev/null || true

# ── Done ─────────────────────────────────────────────────────
echo "  ┌──────────────────────────────────────────┐"
echo "  │  DONE                                     │"
echo "  └──────────────────────────────────────────┘"
echo ""
echo "  Desktop : $DESKTOP_OUT/  ($DCOUNT frames)"
echo "  Mobile  : $MOBILE_OUT/   ($MCOUNT frames)"
echo ""
echo "  VERIFY: open frame_0185–0192 in both folders."
echo "  If the Veo badge is still visible, adjust"
echo "  DX/DY/DW/DH at the top of this script."
echo ""
echo "  To preview mask box:  change show=0 → show=1 in"
echo "  extract_frames() delogo call, re-run, inspect a frame."
echo ""
