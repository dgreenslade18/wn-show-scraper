#!/bin/bash

# Helper script to commit shows.json
# Usage: ./commit-shows.sh [path-to-shows.json]

SHOWS_FILE="${1:-shows.json}"

if [ ! -f "$SHOWS_FILE" ]; then
    echo "❌ Error: $SHOWS_FILE not found!"
    echo "Usage: ./commit-shows.sh [path-to-shows.json]"
    echo ""
    echo "Example:"
    echo "  ./commit-shows.sh ~/Downloads/whatnot-shows.json"
    exit 1
fi

# Validate JSON
if ! python3 -m json.tool "$SHOWS_FILE" > /dev/null 2>&1; then
    echo "❌ Error: $SHOWS_FILE is not valid JSON!"
    exit 1
fi

# Copy to project directory
cp "$SHOWS_FILE" ./shows.json
echo "✅ Copied $SHOWS_FILE to ./shows.json"

# Count shows
SHOW_COUNT=$(python3 -c "import json; print(len(json.load(open('shows.json'))))" 2>/dev/null || echo "?")
echo "📊 Found $SHOW_COUNT shows"

# Commit
git add shows.json
git commit -m "Update shows data ($SHOW_COUNT shows)"
echo "✅ Committed shows.json"

# Ask to push
read -p "Push to GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push
    echo "✅ Pushed to GitHub!"
else
    echo "⏭️  Skipped push. Run 'git push' when ready."
fi

