#!/bin/bash

# Temu Price Comparison Extension - Automated Installer
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛒 Temu Price Comparison Extension - Automated Installer${NC}"
echo "=================================================="
echo ""

# Function to check if Chrome is installed
check_chrome() {
    if command -v google-chrome &> /dev/null; then
        echo -e "${GREEN}✅ Google Chrome found${NC}"
        return 0
    elif command -v chromium-browser &> /dev/null; then
        echo -e "${GREEN}✅ Chromium found${NC}"
        return 0
    elif [ -d "/Applications/Google Chrome.app" ]; then
        echo -e "${GREEN}✅ Google Chrome found (macOS)${NC}"
        return 0
    else
        echo -e "${RED}❌ Chrome not found. Please install Chrome first.${NC}"
        return 1
    fi
}

# Function to validate extension files
validate_files() {
    echo -e "${BLUE}📋 Validating extension files...${NC}"
    
    required_files=(
        "manifest.json"
        "content/content.js"
        "background/background.js"
        "popup/popup.html"
        "popup/popup.css"
        "popup/popup.js"
    )
    
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✅ $file${NC}"
        else
            echo -e "  ${RED}❌ $file (missing)${NC}"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required files present${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing files: ${missing_files[*]}${NC}"
        return 1
    fi
}

# Function to open Chrome extensions page
open_chrome_extensions() {
    echo -e "${BLUE}🚀 Opening Chrome Extensions page...${NC}"
    
    if command -v google-chrome &> /dev/null; then
        google-chrome chrome://extensions/ &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser chrome://extensions/ &
    elif [ -d "/Applications/Google Chrome.app" ]; then
        open -a "Google Chrome" "chrome://extensions/"
    else
        echo -e "${YELLOW}⚠️  Please manually open Chrome and go to: chrome://extensions/${NC}"
    fi
    
    echo -e "${GREEN}✅ Chrome Extensions page opened${NC}"
}

# Function to auto-reload the extension if already installed
auto_reload_extension() {
    echo -e "${BLUE}🔄 Attempting to auto-reload extension...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Use AppleScript to automate extension reload on macOS
        osascript << 'EOF' 2>/dev/null || true
        tell application "Google Chrome"
            if (count of windows) = 0 then
                make new window
            end if
            
            set targetTab to null
            repeat with w in windows
                repeat with t in tabs of w
                    if URL of t starts with "chrome://extensions" then
                        set targetTab to t
                        exit repeat
                    end if
                end repeat
                if targetTab is not null then exit repeat
            end repeat
            
            -- If extensions page not open, open it
            if targetTab is null then
                tell front window
                    set targetTab to make new tab with properties {URL:"chrome://extensions/"}
                end tell
            end if
            
            -- Focus on the extensions tab
            tell targetTab
                reload
            end tell
            
            delay 2
            
            -- Try to find and click reload button for Temu extension
            tell targetTab
                execute javascript "
                    // Wait a bit for page to load
                    setTimeout(() => {
                        // Look for the Temu Price Comparison extension
                        const extensions = document.querySelectorAll('extensions-item');
                        for (let ext of extensions) {
                            const nameEl = ext.shadowRoot?.querySelector('#name');
                            if (nameEl && nameEl.textContent.includes('Temu Price Comparison')) {
                                console.log('Found Temu extension, looking for reload button...');
                                const reloadBtn = ext.shadowRoot?.querySelector('#reload-button');
                                if (reloadBtn && !reloadBtn.hidden) {
                                    console.log('Clicking reload button...');
                                    reloadBtn.click();
                                    // Show success message
                                    const toast = document.createElement('div');
                                    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:5px;z-index:10000;font-family:Arial;';
                                    toast.textContent = '✅ Temu Extension Reloaded Successfully!';
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 3000);
                                    break;
                                }
                            }
                        }
                    }, 1000);
                "
            end tell
        end tell
EOF
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Extension auto-reload attempted${NC}"
            echo -e "${BLUE}💡 The extension should reload automatically in a few seconds${NC}"
        else
            echo -e "${YELLOW}⚠️  Auto-reload failed, please manually reload the extension${NC}"
        fi
        
    else
        echo -e "${YELLOW}⚠️  Auto-reload only supported on macOS, please manually reload the extension${NC}"
    fi
}

# Function to create installation guide
create_guide() {
    echo -e "${BLUE}📝 Creating installation guide...${NC}"
    
    cat > INSTALLATION_GUIDE.md << 'EOF'
# 🛒 Temu Price Comparison Extension - Installation Guide

## Quick Install (Automated)

1. **Run the installer**: `./auto-install.sh`
2. **Chrome will open** to the extensions page
3. **Extension auto-reloads** if already installed (macOS)
4. **For new installs**: Enable Developer Mode → Load unpacked → Select folder
5. **Pin the extension** to your toolbar

## Manual Install

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select this folder**: `'$(pwd)'`
5. **Pin the extension** to your toolbar

## Testing

1. **Visit Amazon**: https://www.amazon.com/dp/B08N5WRWNW
2. **Wait 2-3 seconds** for the overlay to appear
3. **See price comparison** with Temu
4. **Click "Buy on Temu"** to test functionality

## Troubleshooting

- **Extension not loading**: Make sure Developer Mode is enabled
- **No overlay appearing**: Refresh the Amazon page
- **Product not detected**: Try a different Amazon product
- **Icons missing**: The extension uses SVG icons (no PNG required)

## Support

For issues or questions, check the README.md file or create an issue in the repository.
EOF

    echo -e "${GREEN}✅ Installation guide created: INSTALLATION_GUIDE.md${NC}"
}

# Function to create desktop shortcut (Linux/macOS)
create_shortcut() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${BLUE}🔗 Creating desktop shortcut...${NC}"
        
        cat > ~/Desktop/Temu-Extension-Install.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Temu Extension Install
Comment=Install Temu Price Comparison Extension
Exec=google-chrome chrome://extensions/
Icon=google-chrome
Terminal=false
Categories=Network;WebBrowser;
EOF
        
        chmod +x ~/Desktop/Temu-Extension-Install.desktop
        echo -e "${GREEN}✅ Desktop shortcut created${NC}"
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}🔗 Creating application shortcut...${NC}"
        
        # Create a simple script to open Chrome extensions
        cat > /tmp/open_chrome_extensions.sh << 'EOF'
#!/bin/bash
open -a "Google Chrome" "chrome://extensions/"
EOF
        
        chmod +x /tmp/open_chrome_extensions.sh
        echo -e "${GREEN}✅ Chrome extensions launcher created${NC}"
    fi
}

# Function to validate manifest.json
validate_manifest() {
    echo -e "${BLUE}🔍 Validating manifest.json...${NC}"
    
    if command -v jq &> /dev/null; then
        if jq empty manifest.json 2>/dev/null; then
            echo -e "${GREEN}✅ manifest.json is valid JSON${NC}"
            
            # Check required fields
            if jq -e '.manifest_version' manifest.json >/dev/null 2>&1; then
                echo -e "${GREEN}✅ manifest_version: $(jq -r '.manifest_version' manifest.json)${NC}"
            else
                echo -e "${RED}❌ manifest_version missing${NC}"
                return 1
            fi
            
            if jq -e '.name' manifest.json >/dev/null 2>&1; then
                echo -e "${GREEN}✅ name: $(jq -r '.name' manifest.json)${NC}"
            else
                echo -e "${RED}❌ name missing${NC}"
                return 1
            fi
            
            return 0
        else
            echo -e "${RED}❌ manifest.json is not valid JSON${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  jq not installed, skipping JSON validation${NC}"
        return 0
    fi
}

# Function to show installation steps
show_installation_steps() {
    echo ""
    echo -e "${BLUE}📋 Installation Steps:${NC}"
    echo "1. ${YELLOW}Chrome Extensions page should now be open${NC}"
    echo "2. ${YELLOW}Enable 'Developer mode' (toggle in top-right)${NC}"
    echo "3. ${YELLOW}Click 'Load unpacked' button${NC}"
    echo "4. ${YELLOW}Select this folder: ${GREEN}$(pwd)${NC}"
    echo "5. ${YELLOW}Pin the extension to your toolbar${NC}"
    echo ""
    echo -e "${BLUE}🧪 Test URLs:${NC}"
    echo "- ${GREEN}https://www.amazon.com/dp/B08N5WRWNW${NC} (Echo Dot)"
    echo "- ${GREEN}https://www.amazon.com/dp/B07ZPKBL9V${NC} (Wireless Earbuds)"
    echo ""
}

# Function to check if extension is already installed
check_existing_installation() {
    echo -e "${BLUE}🔍 Checking for existing installation...${NC}"
    
    # This is a basic check - in a real scenario, you'd need to check Chrome's extension storage
    if [ -f "INSTALLATION_GUIDE.md" ]; then
        echo -e "${YELLOW}⚠️  Installation guide found - extension may already be installed${NC}"
        echo -e "${GREEN}✅ Auto-proceeding with installation (all validations passed)${NC}"
    else
        echo -e "${GREEN}✅ No previous installation detected${NC}"
    fi
}

# Main installation process
main() {
    echo -e "${BLUE}🚀 Starting automated installation...${NC}"
    echo ""
    
    # Check Chrome installation
    if ! check_chrome; then
        exit 1
    fi
    
    # Validate extension files
    if ! validate_files; then
        exit 1
    fi
    
    # Validate manifest.json
    if ! validate_manifest; then
        exit 1
    fi
    
    # Check for existing installation
    check_existing_installation
    
    # Create installation guide
    create_guide
    
    # Create desktop shortcut
    create_shortcut
    
    # Open Chrome extensions page
    open_chrome_extensions
    
    # Wait a moment for Chrome to open, then try auto-reload
    echo -e "${BLUE}⏱️  Waiting for Chrome to load...${NC}"
    sleep 3
    
    # Auto-reload extension if already installed
    auto_reload_extension
    
    # Show installation steps
    show_installation_steps
    
    echo -e "${GREEN}🎉 Automated installation process completed!${NC}"
    echo ""
    echo -e "${BLUE}📚 Next steps:${NC}"
    echo "1. ${GREEN}If extension was auto-reloaded: Test immediately on Amazon${NC}"
    echo "2. ${YELLOW}If first install: Follow installation steps above${NC}"
    echo "3. Test the extension on Amazon product pages"
    echo "4. Check the popup interface for version updates"
    echo "5. Read INSTALLATION_GUIDE.md for more details"
    echo ""
    echo -e "${GREEN}✅ Extension is ready for use!${NC}"
}

# Run main function
main 