#!/bin/bash

# Golf Booking Bot Deployment Script
# This script deploys the bot to a production server

set -e

echo "🚀 Deploying Golf Booking Bot..."

# Configuration
CONTAINER_NAME="golf-booking-bot"
IMAGE_NAME="golf-booking-bot"
COMPOSE_FILE="docker-compose.yml"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker-compose -f $COMPOSE_FILE down || true

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs screenshots

# Set permissions
echo "🔐 Setting permissions..."
chmod 600 .env
chmod 755 logs screenshots

# Start the container
echo "🚀 Starting container..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check container status
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Container is running"
    
    # Show container logs
    echo "📋 Container logs:"
    docker-compose -f $COMPOSE_FILE logs --tail=20
    
    # Show container status
    echo "📊 Container status:"
    docker-compose -f $COMPOSE_FILE ps
    
else
    echo "❌ Container failed to start"
    echo "📋 Error logs:"
    docker-compose -f $COMPOSE_FILE logs
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📋 Management commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop bot: docker-compose down"
echo "- Restart bot: docker-compose restart"
echo "- Update bot: ./scripts/deploy.sh"
echo ""
echo "📊 Monitoring:"
echo "- Container status: docker ps"
echo "- Resource usage: docker stats $CONTAINER_NAME"
echo "- Logs: tail -f logs/golf-bot.log"
echo ""
echo "🔧 Configuration:"
echo "- Edit settings: .env"
echo "- View config: docker-compose config"
echo ""
echo "🚀 Bot is now running and will attempt bookings at midnight!"

