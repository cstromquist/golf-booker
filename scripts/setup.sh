#!/bin/bash

# Golf Booking Bot Setup Script
# This script sets up the development environment and installs dependencies

set -e

echo "🏌️ Setting up Golf Booking Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs screenshots screenshots/errors

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your credentials and preferences"
    echo ""
    echo "🔧 For Smart Golf Booking, you need to set:"
    echo "   GOLF_EMAIL, GOLF_PASSWORD, CREDIT_CARD, CVV, BILLING_ADDRESS, POSTAL_CODE"
    echo ""
    read -p "Do you want to set up your environment now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/setup_env.sh
    fi
fi

# Create config file if it doesn't exist
if [ ! -f config.json ]; then
    echo "📝 Creating config file..."
    node -e "
    const { ConfigManager } = require('./src/config/ConfigManager');
    const config = new ConfigManager();
    config.createSampleConfig();
    "
fi

# Set up cron job (optional)
read -p "🕐 Do you want to set up a cron job for automated booking? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📅 Setting up cron job..."
    
    # Get current directory
    CURRENT_DIR=$(pwd)
    
    # Create cron job entry
    CRON_ENTRY="0 0 * * * cd $CURRENT_DIR && node src/index.js book >> logs/cron.log 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    echo "✅ Cron job added: Daily at midnight"
    echo "📋 To view cron jobs: crontab -l"
    echo "🗑️  To remove cron job: crontab -e"
fi

# Create systemd service (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    read -p "🔧 Do you want to create a systemd service? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Creating systemd service..."
        
        sudo tee /etc/systemd/system/golf-booking-bot.service > /dev/null <<EOF
[Unit]
Description=Golf Booking Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/node src/index.js cron
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable golf-booking-bot
        
        echo "✅ Systemd service created and enabled"
        echo "🚀 Start service: sudo systemctl start golf-booking-bot"
        echo "📊 Check status: sudo systemctl status golf-booking-bot"
    fi
fi

# Set permissions
echo "🔐 Setting permissions..."
chmod +x scripts/*.sh
chmod 600 .env

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Test the bot: npm run dev"
echo "3. Run a booking: node src/index.js book"
echo "4. Start cron job: node src/index.js cron"
echo ""
echo "📚 Documentation:"
echo "- PRD: PRD.md"
echo "- Configuration: .env"
echo "- Logs: logs/"
echo "- Screenshots: screenshots/"
echo ""
echo "🚀 Happy golfing!"
