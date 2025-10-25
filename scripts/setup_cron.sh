#!/bin/bash

# Golf Booking Bot - Cron Job Setup Script
# This script sets up a cron job to run the golf booking bot every Friday at midnight

set -e

echo "🏌️ Setting up Golf Booking Bot Cron Job..."
echo "================================================"

# Get the current directory (where the script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run './scripts/setup_env.sh' first to set up your environment variables."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Get the full path to the booking script
BOOKING_SCRIPT="$PROJECT_DIR/scripts/book_golf.js"

if [ ! -f "$BOOKING_SCRIPT" ]; then
    echo "❌ Error: Booking script not found at $BOOKING_SCRIPT"
    exit 1
fi

# Get the full path to Node.js
NODE_PATH=$(which node)

echo "🔧 Configuration:"
echo "   Node.js path: $NODE_PATH"
echo "   Script path: $BOOKING_SCRIPT"
echo "   Working directory: $PROJECT_DIR"

# Create the cron job entry
# Format: minute hour day month weekday command
# 0 0 * * 5 = Every Friday at midnight (00:00)
CRON_ENTRY="0 0 * * 5 cd $PROJECT_DIR && $NODE_PATH $BOOKING_SCRIPT >> $PROJECT_DIR/logs/cron.log 2>&1"

echo ""
echo "📅 Cron job will run: Every Friday at 12:00 AM (midnight)"
echo "📝 Command: $CRON_ENTRY"
echo ""

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "book_golf.js"; then
    echo "⚠️  A cron job for the golf booking bot already exists!"
    echo "Current cron jobs:"
    crontab -l | grep -E "(book_golf|golf)" || echo "   (none found)"
    echo ""
    read -p "Do you want to replace it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
    
    # Remove existing golf booking cron jobs
    crontab -l | grep -v "book_golf.js" | crontab -
    echo "✅ Removed existing golf booking cron jobs"
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "📋 Current cron jobs:"
crontab -l | grep -E "(book_golf|golf)" || echo "   (none found)"
echo ""
echo "🎯 Your golf booking bot will now run automatically every Friday at midnight!"
echo ""
echo "📊 Monitoring:"
echo "   • Check logs: tail -f $PROJECT_DIR/logs/cron.log"
echo "   • View cron jobs: crontab -l"
echo "   • Remove cron job: crontab -e (then delete the line)"
echo ""
echo "⚠️  Important Notes:"
echo "   • Make sure your computer is on and awake at midnight on Fridays"
echo "   • The bot will run in headless mode (no browser window visible)"
echo "   • Check the logs to verify successful bookings"
echo "   • Consider using a server or always-on computer for reliability"
