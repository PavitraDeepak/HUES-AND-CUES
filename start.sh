#!/bin/bash

# Hues & Cues - Quick Start Script
echo "🎨 Starting Hues & Cues..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please update MONGODB_URI in .env with your MongoDB connection string"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 Starting server on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
