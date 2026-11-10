#!/bin/bash
# macOS render source: Swift / Apple frameworks + ffmpeg. Not needed to air the show.
set -euo pipefail
cd "$(dirname "$0")/.."
node_runner="${NODE_BIN:-node}"
render_dir="$(mktemp -d /tmp/rbtv-bumpers.XXXXXX)"
"$node_runner" --input-type=module -e 'import {segmentLibrary} from "./docs/segments.mjs"; process.stdout.write(JSON.stringify(segmentLibrary));' > "$render_dir/catalog.json"
swiftc -O tools/render-bumpers.swift -o "$render_dir/render"
"$render_dir/render" "$render_dir/catalog.json" docs/media/prep-signal.png "$render_dir" "$@"
for silent in "$render_dir"/*.mp4; do
  slug="$(basename "$silent" .mp4)"
  # Original stinger: brief sweep, two soft chimes and an exit tick. No samples.
  audio='aevalsrc=0.20*sin(2*PI*(115*t+90*t*t))*exp(-5*t)*min(1\,40*t)+0.17*sin(2*PI*294*(t-0.31))*exp(-5*abs(t-0.31))*min(1\,max(0\,90*(t-0.31)))+0.11*sin(2*PI*440*(t-0.65))*exp(-5*abs(t-0.65))*min(1\,max(0\,90*(t-0.65)))+0.065*sin(2*PI*585*(t-4.20))*exp(-24*abs(t-4.20))*min(1\,max(0\,80*(t-4.20))):s=48000:d=4.5'
  ffmpeg -hide_banner -loglevel error -y -i "$silent" -f lavfi -i "$audio" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 144k -ac 2 -movflags +faststart "$render_dir/$slug-ready.mp4"
  mv "$render_dir/$slug-ready.mp4" "docs/media/$slug.mp4"
done
printf 'Rendered bumper files are in docs/media. Temporary render files: %s\n' "$render_dir"
