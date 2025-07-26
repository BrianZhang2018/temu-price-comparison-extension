#!/bin/bash

echo "🚀 Temu Extension Manual Testing Guide"
echo "======================================"
echo ""

# Get the current directory (extension path)
EXTENSION_PATH="$(pwd)"
echo "📁 Extension path: $EXTENSION_PATH"

# Check if manifest.json exists
if [ ! -f "manifest.json" ]; then
    echo "❌ manifest.json not found in current directory"
    echo "   Please run this script from your extension directory"
    exit 1
fi

echo "✅ Extension manifest found"
echo ""

# Launch Chrome with extension loaded
echo "🔧 Launching Chrome with your extension..."
echo "   Extension will be loaded from: $EXTENSION_PATH"
echo ""

# Chrome path for macOS
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Launch Chrome with extension
"$CHROME_PATH" \
  --load-extension="$EXTENSION_PATH" \
  --disable-extensions-except="$EXTENSION_PATH" \
  --new-window \
  "https://www.amazon.com/ABORON-Oversized-Folding-Camping-Outdoor/dp/B0CL6D662J" &

echo "✅ Chrome launched with your extension!"
echo ""
echo "📋 MANUAL TESTING STEPS:"
echo "========================"
echo ""
echo "1. 🔍 Open Chrome DevTools (F12 or Cmd+Option+I)"
echo ""
echo "2. 📱 Go to chrome://extensions/ in a new tab"
echo "   - Find 'Temu Price Comparison' extension"
echo "   - Click on 'service worker' link (if available)"
echo "   - This opens the service worker DevTools"
echo ""
echo "3. 🔄 Go back to the Amazon product page tab"
echo "   - Open DevTools on that page too (F12)"
echo "   - Go to Console tab"
echo "   - Look for content script logs"
echo ""
echo "4. 🎯 Expected logs to look for:"
echo "   Content Script Logs (in page DevTools):"
echo "   └─ 'Temu Price Comparison: Content script loaded'"
echo "   └─ 'Temu Price Comparison: Product page detected'"
echo ""
echo "   Service Worker Logs (in extension DevTools):"
echo "   └─ '🚀 Temu Price Comparison: Background script loaded - v1.6.2'"
echo "   └─ Any hot items or API-related logs"
echo ""
echo "5. 🔄 Test page reload:"
echo "   - Reload the Amazon page (F5)"
echo "   - Check if logs appear again"
echo "   - Verify extension re-initializes properly"
echo ""
echo "6. 🧪 Test different Amazon products:"
echo "   - Current: https://www.amazon.com/ABORON-Oversized-Folding-Camping-Outdoor/dp/B0CL6D662J (Camping Chair)"
echo "   - Try: https://www.amazon.com/Echo-Dot-3rd-Gen-Charcoal/dp/B07FZ8S74R (Echo Dot)"
echo "   - Try: https://www.amazon.com/dp/B09B8V1LZ3 (Echo Dot 5th Gen)"
echo "   - See if extension detects different product categories"
echo ""
echo "💡 TROUBLESHOOTING:"
echo "==================="
echo ""
echo "❌ No extension logs?"
echo "   • Check if extension is enabled in chrome://extensions/"
echo "   • Look for error messages in extension DevTools"
echo "   • Try reloading the extension"
echo ""
echo "❌ Service worker not found?"
echo "   • It might take a moment to initialize"
echo "   • Try visiting the Amazon page first"
echo "   • Check for 'Errors' button in chrome://extensions/"
echo ""
echo "❌ Content script not running?"
echo "   • Check the URL matches the manifest permissions"
echo "   • Look for JavaScript errors in page console"
echo "   • Verify Amazon didn't change their page structure"
echo ""
echo "✅ Extension working correctly if you see:"
echo "   ✓ Content script loads on Amazon pages"
echo "   ✓ Service worker initializes and logs background activity"
echo "   ✓ Extension detects product pages"
echo "   ✓ No JavaScript errors in either console"
echo ""
echo "🎉 Happy testing!" 