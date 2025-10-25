#!/bin/bash

# Golf Booking Bot - Local Automation Setup
# This script sets up automation on your local computer

set -e

echo "🏌️ Setting up Golf Booking Bot on Your Local Computer"
echo "====================================================="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run './scripts/setup_env.sh' first to set up your environment variables."
    exit 1
fi

echo "✅ Environment file found"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Get the full path to the booking script
BOOKING_SCRIPT="$PROJECT_DIR/scripts/book_golf.js"
NODE_PATH=$(which node)

echo "🔧 Configuration:"
echo "   Node.js path: $NODE_PATH"
echo "   Script path: $BOOKING_SCRIPT"
echo "   Working directory: $PROJECT_DIR"

# Create the cron job entry for every day at midnight
# The script will automatically calculate the next Friday (7 days out) when no date is provided
CRON_ENTRY="0 0 * * * cd $PROJECT_DIR && $NODE_PATH $BOOKING_SCRIPT >> $PROJECT_DIR/logs/cron.log 2>&1"

echo ""
echo "📅 Setting up cron job to run every day at 12:00 AM"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "book_golf.js"; then
    echo "⚠️  A cron job for the golf booking bot already exists!"
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
echo "🎯 Your golf booking bot will now run automatically every day at midnight!"
echo ""
echo "⚠️  IMPORTANT: Your computer must be ON and AWAKE at midnight every day!"
echo ""
echo "📊 Monitoring:"
echo "   • Check logs: tail -f $PROJECT_DIR/logs/cron.log"
echo "   • View cron jobs: crontab -l"
echo "   • Test the bot: node $BOOKING_SCRIPT"
echo ""
echo "💡 For 24/7 reliability, consider using a cloud server (DigitalOcean, AWS, etc.)"
