#!/bin/bash

# Temu Price Comparison Extension - Installation Script
echo "🛒 Temu Price Comparison Extension Installer"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found!"
    echo "Please run this script from the extension directory."
    exit 1
fi

echo "✅ Extension files found"
echo "📁 Current directory: $(pwd)"
echo ""

# Show file structure
echo "📋 Extension Structure:"
find . -type f -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.json" -o -name "*.svg" | sort
echo ""

# Instructions
echo "🚀 Installation Instructions:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory: $(pwd)"
echo "5. Pin the extension to your toolbar"
echo ""

# Test URLs
echo "🧪 Testing URLs:"
echo "- Amazon Product: https://www.amazon.com/dp/B08N5WRWNW"
echo "- Amazon Product: https://www.amazon.com/dp/B07ZPKBL9V"
echo ""

# Validation
echo "🔍 Validation:"
echo "- manifest.json: $(wc -l < manifest.json) lines"
echo "- content.js: $(wc -l < content/content.js) lines"
echo "- background.js: $(wc -l < background/background.js) lines"
echo "- popup files: $(ls popup/* | wc -l) files"
echo "- icon files: $(ls assets/icons/* | wc -l) files"
echo ""

echo "✅ Extension is ready for installation!"
echo "Visit an Amazon product page to test the price comparison feature."
echo ""
echo "📚 For more information, see README.md" 