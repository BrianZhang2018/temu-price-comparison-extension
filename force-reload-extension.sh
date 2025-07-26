#!/bin/bash

# Force reload extension and clear cache
echo "🔄 Force reloading Temu Price Comparison Extension..."

# Update version with timestamp to force reload
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "📝 Adding cache-busting timestamp: $TIMESTAMP"

# Kill Chrome processes to clear all cache
echo "🛑 Closing Chrome to clear cache..."
osascript -e 'quit app "Google Chrome"' 2>/dev/null || true
pkill -f "Google Chrome" 2>/dev/null || true
sleep 2

# Clear Chrome extension cache directory (if accessible)
CHROME_CACHE="$HOME/Library/Caches/Google/Chrome/Default/Extensions"
if [ -d "$CHROME_CACHE" ]; then
    echo "🗑️  Clearing Chrome extension cache..."
    rm -rf "$CHROME_CACHE"/*
fi

# Restart Chrome and open extensions page
echo "🚀 Restarting Chrome and opening extensions page..."
open -a "Google Chrome" "chrome://extensions/"

sleep 3

# Auto-reload the extension
echo "🔄 Attempting to reload Temu extension..."
osascript << 'EOF'
tell application "Google Chrome"
    if (count of windows) = 0 then
        make new window
    end if
    
    tell front window
        set targetTab to make new tab with properties {URL:"chrome://extensions/"}
    end tell
    
    delay 3
    
    tell front tab of front window
        execute javascript "
            console.log('🔍 Looking for Temu Price Comparison extension...');
            setTimeout(() => {
                const extensions = document.querySelectorAll('extensions-item');
                console.log('Found', extensions.length, 'extensions');
                
                for (let ext of extensions) {
                    const nameEl = ext.shadowRoot?.querySelector('#name');
                    if (nameEl && nameEl.textContent.includes('Temu Price Comparison')) {
                        console.log('✅ Found Temu extension!');
                        
                        // First try to disable/enable to force reload
                        const toggleBtn = ext.shadowRoot?.querySelector('#enableToggle');
                        if (toggleBtn && !toggleBtn.disabled) {
                            console.log('🔄 Toggling extension off/on...');
                            toggleBtn.click();
                            setTimeout(() => {
                                toggleBtn.click();
                                console.log('✅ Extension reloaded via toggle!');
                                
                                // Show success notification
                                const toast = document.createElement('div');
                                toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:20px;border-radius:8px;z-index:10000;font-family:Arial;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
                                toast.innerHTML = '🚀 Temu Extension Force Reloaded!<br/>Cache Cleared & Latest Code Loaded';
                                document.body.appendChild(toast);
                                setTimeout(() => toast.remove(), 5000);
                            }, 1000);
                            return;
                        }
                        
                        // Fallback: try reload button
                        const reloadBtn = ext.shadowRoot?.querySelector('#reload-button');
                        if (reloadBtn && !reloadBtn.hidden) {
                            console.log('🔄 Clicking reload button...');
                            reloadBtn.click();
                            
                            const toast = document.createElement('div');
                            toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#FF9800;color:white;padding:20px;border-radius:8px;z-index:10000;font-family:Arial;font-size:16px;font-weight:bold;';
                            toast.innerHTML = '⚠️ Extension Reloaded<br/>Check console for version';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 4000);
                        }
                        break;
                    }
                }
            }, 2000);
        "
    end tell
end tell
EOF

echo "✅ Force reload completed!"
echo "🧪 Test the extension now - check console for new timestamp!"
echo "📝 Look for: '🚀 Temu Price Comparison: Background script loaded - v1.6.2 - CACHE BUSTED'" 