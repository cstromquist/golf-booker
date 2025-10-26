#!/bin/bash

# View the latest tee time summary
# This script shows the most recent summary from the tee time checker

echo "🏌️ JC Golf Tee Time Summary Viewer"
echo "=================================="
echo ""

# Check if summary log exists
if [ ! -f "logs/tee-time-summary.log" ]; then
    echo "❌ No summary log found. Run the tee time checker first:"
    echo "   node src/scripts/jc_golf_tee_time_checker.js"
    exit 1
fi

# Show the latest summary
echo "📊 Latest Tee Time Summary:"
echo "=========================="
echo ""

# Get the last complete summary (from the last "=" line to the end)
tail -n 200 logs/tee-time-summary.log | sed -n '/^=.*JC GOLF TEE TIME SUMMARY/,/^=.*Report generated/p' | tail -n +2 | head -n -1

echo ""
echo "📁 Full log available at: logs/tee-time-summary.log"
echo "🔄 Run checker again: node src/scripts/jc_golf_tee_time_checker.js"
