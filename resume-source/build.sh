#!/bin/bash
# Prints resume.html to the PDF the site links to.
# Usage: bash resume-source/build.sh
cd "$(dirname "$0")/.."
OUT="assets/sydney-nguyen-resume.pdf"
TMP="$(mktemp -d)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 \
  --user-data-dir="$TMP" --print-to-pdf="$OUT" \
  "file://$PWD/resume-source/resume.html" >/dev/null 2>&1
rm -rf "$TMP"
ls -la "$OUT"
