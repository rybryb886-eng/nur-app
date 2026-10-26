#!/usr/bin/env bash
# Generates every app icon from one 1024x1024 square source image (needs ImageMagick).
# Usage: scripts/import-icon.sh <image path or URL> [output dir, default assets/images]
set -euo pipefail

SRC="$1"
OUT="${2:-assets/images}"
TMP="$(mktemp -d)"
mkdir -p "$OUT"

if [[ "$SRC" == http* ]]; then
  curl -fsSL -o "$TMP/src.img" "$SRC"
  SRC="$TMP/src.img"
fi
IM=$(command -v magick || command -v convert)

# Full-bleed square icon (iOS rounds the corners itself).
$IM "$SRC" -resize 1024x1024^ -gravity center -extent 1024x1024 -strip "$OUT/icon.png"

# Android adaptive icon: the artwork is the background layer, the foreground is left empty.
cp "$OUT/icon.png" "$OUT/android-icon-background.png"
$IM -size 1024x1024 xc:none "$OUT/android-icon-foreground.png"

# Themed (monochrome) icon: keep only the bright symbol, as white on transparent.
$IM "$OUT/icon.png" -colorspace Gray -level 75%,95% -resize 70% -gravity center -background black -extent 1024x1024 \
  "$TMP/mask.png"
$IM -size 1024x1024 xc:white "$TMP/mask.png" -alpha off -compose CopyOpacity -composite "$OUT/android-icon-monochrome.png"

# Splash: the icon with rounded corners on the app's night background.
$IM "$OUT/icon.png" -resize 512x512 \( +clone -alpha extract -fill black -colorize 100 -fill white \
  -draw "roundrectangle 0,0 511,511 112,112" \) -alpha off -compose CopyOpacity -composite "$OUT/splash-icon.png"

$IM "$OUT/icon.png" -resize 48x48 "$OUT/favicon.png"
rm -rf "$TMP"
echo "Icons written to $OUT"
