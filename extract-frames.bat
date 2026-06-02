@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM  ZEUS – Essensuals  |  extract-frames.bat
REM
REM  Extracts JPEG frame sequences from both salon videos.
REM  Removes the Veo AI-video watermark from the bottom-right
REM  corner during extraction using ffmpeg's delogo filter.
REM
REM  REQUIREMENTS:
REM    • ffmpeg must be installed and available on PATH
REM      Download: https://ffmpeg.org/download.html
REM      (Recommended: ffmpeg-release-essentials from gyan.dev)
REM
REM  USAGE:
REM    1. Copy both videos into assets\videos\ :
REM         assets\videos\saloon-desktop.mp4
REM         assets\videos\saloon-mobile.mp4
REM    2. Double-click this .bat file (or run from CMD in project root)
REM    3. Frames land in:
REM         assets\frames\desktop\frame_0001.jpg … frame_0192.jpg
REM         assets\frames\mobile\frame_0001.jpg  … frame_0192.jpg
REM    4. Open a few of the last frames and confirm the Veo badge
REM       is gone. Adjust the badge coordinates below if needed.
REM ============================================================

echo.
echo  +===========================================+
echo  ^|   ZEUS – Essensuals  Frame Extractor      ^|
echo  ^|   Veo badge removal + JPEG export         ^|
echo  +===========================================+
echo.

REM ── Verify ffmpeg is available ─────────────────────────────
where ffmpeg >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] ffmpeg not found on PATH.
  echo  Download from https://ffmpeg.org/download.html
  echo  and add it to your system PATH, then re-run.
  pause
  exit /b 1
)

REM ── Input videos ────────────────────────────────────────────
REM  Pointing directly to your Downloads folder (disk was full for a copy).
REM  Change these paths if you move the videos elsewhere.
SET DESKTOP_VIDEO=C:\Users\SARATH CHANDRAN R\Downloads\saloon landing page video.mp4
SET MOBILE_VIDEO=C:\Users\SARATH CHANDRAN R\Downloads\saloon landing page video for mobile.mp4

REM ── Output directories ──────────────────────────────────────
SET DESKTOP_OUT=assets\frames\desktop
SET MOBILE_OUT=assets\frames\mobile

REM ── JPEG quality  (2=best quality/largest, 31=worst/smallest)
REM    4-5 is a good balance for scroll-scrub frames.
SET QUALITY=4

REM ── Veo badge coordinates – DESKTOP (1920×1080) ─────────────
REM  The Veo badge sits in the bottom-right corner.
REM  delogo parameters: x=left edge, y=top edge, w=width, h=height
REM  (pixel values after the video is scaled to 1920px wide)
REM
REM  To verify: temporarily change show=0 to show=1 — ffmpeg will
REM  draw a green rectangle so you can see exactly what is masked.
REM  Re-run with show=0 once you're happy with the coverage.
SET DX=1668
SET DY=1008
SET DW=252
SET DH=72

REM ── Veo badge coordinates – MOBILE (1080×1920) ──────────────
SET MX=935
SET MY=1836
SET MW=145
SET MH=84

REM ── Create output directories ───────────────────────────────
if not exist "%DESKTOP_OUT%" mkdir "%DESKTOP_OUT%"
if not exist "%MOBILE_OUT%"  mkdir "%MOBILE_OUT%"

REM ══════════════════════════════════════════════════════════════
REM  STEP 1 — DESKTOP FRAMES
REM ══════════════════════════════════════════════════════════════
echo  [1/2] Extracting DESKTOP frames ...
echo        Source : %DESKTOP_VIDEO%
echo        Output : %DESKTOP_OUT%\frame_0001.jpg ... frame_0192.jpg
echo        Badge  : delogo x=%DX% y=%DY% w=%DW% h=%DH%
echo.

ffmpeg -y -i "%DESKTOP_VIDEO%" ^
  -vf "scale=1920:-1,delogo=x=%DX%:y=%DY%:w=%DW%:h=%DH%:show=0" ^
  -q:v %QUALITY% ^
  "%DESKTOP_OUT%\frame_%%04d.jpg"

if errorlevel 1 (
  echo.
  echo  [WARN] delogo failed for desktop ^(some ffmpeg builds omit it^).
  echo         Falling back to drawbox ^(fills badge region with dark colour^)...
  echo.
  ffmpeg -y -i "%DESKTOP_VIDEO%" ^
    -vf "scale=1920:-1,drawbox=x=%DX%:y=%DY%:w=%DW%:h=%DH%:color=#0a0a0a:t=fill" ^
    -q:v %QUALITY% ^
    "%DESKTOP_OUT%\frame_%%04d.jpg"
  if errorlevel 1 (
    echo  [ERROR] Desktop frame extraction failed. Check the video path and try again.
    pause
    exit /b 1
  )
)

REM Count extracted frames
set /a DCOUNT=0
for %%f in ("%DESKTOP_OUT%\frame_*.jpg") do set /a DCOUNT+=1
echo  OK – %DCOUNT% desktop frames extracted.
echo.

REM ══════════════════════════════════════════════════════════════
REM  STEP 2 — MOBILE FRAMES
REM ══════════════════════════════════════════════════════════════
echo  [2/2] Extracting MOBILE frames ...
echo        Source : %MOBILE_VIDEO%
echo        Output : %MOBILE_OUT%\frame_0001.jpg ... frame_0192.jpg
echo        Badge  : delogo x=%MX% y=%MY% w=%MW% h=%MH%
echo.

ffmpeg -y -i "%MOBILE_VIDEO%" ^
  -vf "scale=1080:-1,delogo=x=%MX%:y=%MY%:w=%MW%:h=%MH%:show=0" ^
  -q:v %QUALITY% ^
  "%MOBILE_OUT%\frame_%%04d.jpg"

if errorlevel 1 (
  echo.
  echo  [WARN] delogo failed for mobile. Falling back to drawbox...
  echo.
  ffmpeg -y -i "%MOBILE_VIDEO%" ^
    -vf "scale=1080:-1,drawbox=x=%MX%:y=%MY%:w=%MW%:h=%MH%:color=#0a0a0a:t=fill" ^
    -q:v %QUALITY% ^
    "%MOBILE_OUT%\frame_%%04d.jpg"
  if errorlevel 1 (
    echo  [ERROR] Mobile frame extraction failed.
    pause
    exit /b 1
  )
)

set /a MCOUNT=0
for %%f in ("%MOBILE_OUT%\frame_*.jpg") do set /a MCOUNT+=1
echo  OK – %MCOUNT% mobile frames extracted.
echo.

REM ══════════════════════════════════════════════════════════════
REM  ALSO COPY VIDEOS FOR FALLBACK PLAYER  (skip silently if disk full)
REM ══════════════════════════════════════════════════════════════
echo  Copying videos for fallback player (skipped if disk is full)...
copy /y "%DESKTOP_VIDEO%" "assets\videos\saloon-desktop.mp4" >nul 2>&1
copy /y "%MOBILE_VIDEO%"  "assets\videos\saloon-mobile.mp4"  >nul 2>&1
echo  (Fallback video copy is optional — canvas frames are the primary path)

REM ══════════════════════════════════════════════════════════════
REM  DONE
REM ══════════════════════════════════════════════════════════════
echo.
echo  +===========================================+
echo  ^|   DONE!                                   ^|
echo  +===========================================+
echo.
echo  Desktop : %DESKTOP_OUT%\  (%DCOUNT% frames)
echo  Mobile  : %MOBILE_OUT%\   (%MCOUNT% frames)
echo.
echo  NEXT STEPS:
echo    1. Open frame_0185.jpg to frame_0192.jpg in both folders.
echo       Confirm the Veo badge is NOT visible.
echo    2. If the badge is still visible, adjust DX/DY/DW/DH above
echo       and re-run (add show=1 to see the mask rectangle first).
echo    3. Then open index.html in a browser to test the site.
echo.
pause
endlocal
