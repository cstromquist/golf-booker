#!/bin/bash

# Golf Booking Bot Environment Setup
# This script helps you set up your .env file with required credentials

echo "🏌️ Golf Booking Bot - Environment Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy example file
echo "📝 Creating .env file from template..."
cp env.example .env

echo ""
echo "🔧 Please edit your .env file with your actual credentials:"
echo ""
echo "Required variables:"
echo "  GOLF_EMAIL=your_email@example.com"
echo "  GOLF_PASSWORD=your_password"
echo "  CREDIT_CARD=1234 5678 9012 3456"
echo "  CVV=123"
echo "  BILLING_ADDRESS=123 Main Street"
echo "  POSTAL_CODE=12345"
echo ""

# Open editor
if command -v nano &> /dev/null; then
    echo "Opening .env file in nano..."
    nano .env
elif command -v vim &> /dev/null; then
    echo "Opening .env file in vim..."
    vim .env
else
    echo "Please edit the .env file manually with your preferred editor."
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Test your configuration:"
echo "  node scripts/book_golf.js 2025-11-15"
echo ""
