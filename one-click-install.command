#!/bin/bash

# Temu Price Comparison Extension - macOS One-Click Installer
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================="
echo -e "    Temu Price Comparison Extension Installer"
echo -e "==================================================${NC}"
echo ""

echo -e "${BLUE}Checking system requirements...${NC}"
echo ""

# Check if Chrome is installed
if [ -d "/Applications/Google Chrome.app" ]; then
    echo -e "${GREEN}✓ Google Chrome found${NC}"
else
    echo -e "${RED}ERROR: Google Chrome not found!${NC}"
    echo "Please install Google Chrome first."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if required files exist
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}ERROR: manifest.json not found!${NC}"
    echo "Please run this script from the extension directory."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi
echo -e "${GREEN}✓ Extension files found${NC}"

echo ""
echo -e "${BLUE}Opening Chrome Extensions page...${NC}"
open -a "Google Chrome" "chrome://extensions/"

echo ""
echo -e "${BLUE}=================================================="
echo -e "Installation Steps:${NC}"
echo -e "${BLUE}==================================================${NC}"
echo "1. Chrome Extensions page should now be open"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked' button"
echo "4. Select this folder: $(pwd)"
echo "5. Pin the extension to your toolbar"
echo ""

echo -e "${BLUE}Test URLs:${NC}"
echo "- https://www.amazon.com/dp/B08N5WRWNW (Echo Dot)"
echo "- https://www.amazon.com/dp/B07ZPKBL9V (Wireless Earbuds)"
echo ""

echo -e "${GREEN}✓ Extension ready for installation!${NC}"
echo ""
read -p "Press Enter to exit..." 