#!/bin/bash

# Chatwoot Setup Script
# This script sets up and starts Chatwoot with Docker

set -e

echo "🚀 Chatwoot Setup"
echo "================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Create .env.chatwoot if it doesn't exist
if [ ! -f .env.chatwoot ]; then
    echo "📝 Creating .env.chatwoot from template..."
    cp .env.chatwoot.example .env.chatwoot

    # Generate secure SECRET_KEY_BASE
    SECRET_KEY=$(openssl rand -hex 32)

    # Update the .env file with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/change-me-to-a-secure-random-string-32-chars-min/$SECRET_KEY/" .env.chatwoot
    else
        # Linux
        sed -i "s/change-me-to-a-secure-random-string-32-chars-min/$SECRET_KEY/" .env.chatwoot
    fi

    echo "✅ .env.chatwoot created with secure SECRET_KEY_BASE"
    echo "⚠️  IMPORTANT: Update .env.chatwoot with your configuration:"
    echo "   - DB_PASSWORD: Change from default"
    echo "   - FRONTEND_URL: Set to your domain"
    echo "   - SMTP settings: Optional, for sending emails"
    echo ""
    read -p "Press Enter after updating .env.chatwoot... "
else
    echo "✅ .env.chatwoot already exists"
fi

echo ""
echo "🐳 Starting Chatwoot with Docker Compose..."
echo ""

# Pull latest images
docker-compose pull

# Start services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "📦 Running database migrations..."
docker-compose exec -T chatwoot bundle exec rake db:create
docker-compose exec -T chatwoot bundle exec rake db:migrate
docker-compose exec -T chatwoot bundle exec rake db:seed_fu

echo ""
echo "✅ Chatwoot Setup Complete!"
echo ""
echo "📍 Access Chatwoot at: http://localhost:3000"
echo ""
echo "👤 Create Admin User:"
echo "   Run: docker-compose exec chatwoot bundle exec rake admin:create_user"
echo ""
echo "📋 Useful Commands:"
echo "   - Start: docker-compose up -d"
echo "   - Stop: docker-compose down"
echo "   - Logs: docker-compose logs -f chatwoot"
echo "   - Database console: docker-compose exec chatwoot bundle exec rails console"
echo ""
echo "🔗 Next Steps:"
echo "   1. Create admin user (command above)"
echo "   2. Login at http://localhost:3000"
echo "   3. Add website channel"
echo "   4. Get embed code and add to your site"
echo ""
