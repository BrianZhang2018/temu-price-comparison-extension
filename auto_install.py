#!/usr/bin/env python3
"""
Temu Price Comparison Extension - Python Auto-Installer
Cross-platform automated installation with GUI support
"""

import os
import sys
import json
import subprocess
import platform
import webbrowser
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, filedialog
import threading

class TemuExtensionInstaller:
    def __init__(self):
        self.extension_dir = Path(__file__).parent
        self.manifest_file = self.extension_dir / "manifest.json"
        self.required_files = [
            "manifest.json",
            "content/content.js",
            "background/background.js",
            "popup/popup.html",
            "popup/popup.css",
            "popup/popup.js"
        ]
        
    def print_banner(self):
        """Print installation banner"""
        banner = """
🛒 Temu Price Comparison Extension - Auto Installer
==================================================
        """
        print(banner)
        
    def check_system(self):
        """Check system requirements"""
        print("🔍 Checking system requirements...")
        
        # Check OS
        system = platform.system()
        print(f"✅ OS: {system}")
        
        # Check Python version
        python_version = sys.version_info
        if python_version.major >= 3 and python_version.minor >= 6:
            print(f"✅ Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
        else:
            print("❌ Python 3.6+ required")
            return False
            
        return True
        
    def validate_files(self):
        """Validate all required extension files"""
        print("\n📋 Validating extension files...")
        
        missing_files = []
        for file_path in self.required_files:
            full_path = self.extension_dir / file_path
            if full_path.exists():
                print(f"  ✅ {file_path}")
            else:
                print(f"  ❌ {file_path} (missing)")
                missing_files.append(file_path)
                
        if missing_files:
            print(f"\n❌ Missing files: {', '.join(missing_files)}")
            return False
            
        print("✅ All required files present")
        return True
        
    def validate_manifest(self):
        """Validate manifest.json file"""
        print("\n🔍 Validating manifest.json...")
        
        try:
            with open(self.manifest_file, 'r') as f:
                manifest = json.load(f)
                
            # Check required fields
            required_fields = ['manifest_version', 'name', 'version', 'description']
            for field in required_fields:
                if field in manifest:
                    print(f"  ✅ {field}: {manifest[field]}")
                else:
                    print(f"  ❌ {field} missing")
                    return False
                    
            print("✅ manifest.json is valid")
            return True
            
        except json.JSONDecodeError:
            print("❌ manifest.json is not valid JSON")
            return False
        except FileNotFoundError:
            print("❌ manifest.json not found")
            return False
            
    def find_chrome(self):
        """Find Chrome installation"""
        print("\n🔍 Looking for Chrome installation...")
        
        system = platform.system()
        chrome_paths = []
        
        if system == "Darwin":  # macOS
            chrome_paths = [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "/Applications/Chromium.app/Contents/MacOS/Chromium"
            ]
        elif system == "Windows":
            chrome_paths = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                r"C:\Users\{}\AppData\Local\Google\Chrome\Application\chrome.exe".format(os.getenv('USERNAME', ''))
            ]
        else:  # Linux
            chrome_paths = [
                "/usr/bin/google-chrome",
                "/usr/bin/chromium-browser",
                "/usr/bin/chromium"
            ]
            
        for path in chrome_paths:
            if os.path.exists(path):
                print(f"✅ Chrome found: {path}")
                return path
                
        print("❌ Chrome not found in standard locations")
        return None
        
    def open_chrome_extensions(self):
        """Open Chrome extensions page"""
        print("\n🚀 Opening Chrome Extensions page...")
        
        chrome_path = self.find_chrome()
        if chrome_path:
            try:
                subprocess.Popen([chrome_path, "chrome://extensions/"])
                print("✅ Chrome Extensions page opened")
                return True
            except Exception as e:
                print(f"❌ Failed to open Chrome: {e}")
                return False
        else:
            # Fallback to default browser
            try:
                webbrowser.open("chrome://extensions/")
                print("✅ Opened extensions page in default browser")
                return True
            except Exception as e:
                print(f"❌ Failed to open browser: {e}")
                return False
                
    def create_installation_guide(self):
        """Create detailed installation guide"""
        print("\n📝 Creating installation guide...")
        
        guide_content = f"""# 🛒 Temu Price Comparison Extension - Installation Guide

## Quick Install (Automated)

1. **Run the installer**: `python auto_install.py`
2. **Follow the prompts** in the terminal
3. **Chrome will open** to the extensions page
4. **Enable Developer Mode** (toggle in top-right)
5. **Click "Load unpacked"** and select this folder
6. **Pin the extension** to your toolbar

## Manual Install

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select this folder**: `{self.extension_dir.absolute()}`
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

## System Information

- **Extension Directory**: {self.extension_dir.absolute()}
- **Platform**: {platform.system()} {platform.release()}
- **Python Version**: {sys.version}
- **Chrome Path**: {self.find_chrome() or 'Not found'}

## Support

For issues or questions, check the README.md file or create an issue in the repository.
"""
        
        guide_file = self.extension_dir / "INSTALLATION_GUIDE.md"
        with open(guide_file, 'w') as f:
            f.write(guide_content)
            
        print(f"✅ Installation guide created: {guide_file}")
        
    def create_desktop_shortcut(self):
        """Create desktop shortcut for easy access"""
        print("\n🔗 Creating desktop shortcut...")
        
        system = platform.system()
        
        if system == "Darwin":  # macOS
            shortcut_content = f"""#!/bin/bash
open -a "Google Chrome" "chrome://extensions/"
echo "Chrome Extensions page opened"
echo "Select folder: {self.extension_dir.absolute()}"
"""
            shortcut_path = Path.home() / "Desktop" / "Temu-Extension-Install.command"
            
        elif system == "Windows":
            shortcut_content = f"""@echo off
start chrome chrome://extensions/
echo Chrome Extensions page opened
echo Select folder: {self.extension_dir.absolute()}
pause
"""
            shortcut_path = Path.home() / "Desktop" / "Temu-Extension-Install.bat"
            
        else:  # Linux
            shortcut_content = f"""[Desktop Entry]
Version=1.0
Type=Application
Name=Temu Extension Install
Comment=Install Temu Price Comparison Extension
Exec=google-chrome chrome://extensions/
Icon=google-chrome
Terminal=false
Categories=Network;WebBrowser;
"""
            shortcut_path = Path.home() / "Desktop" / "Temu-Extension-Install.desktop"
            
        try:
            with open(shortcut_path, 'w') as f:
                f.write(shortcut_content)
                
            # Make executable on Unix systems
            if system != "Windows":
                os.chmod(shortcut_path, 0o755)
                
            print(f"✅ Desktop shortcut created: {shortcut_path}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to create shortcut: {e}")
            return False
            
    def show_installation_steps(self):
        """Display installation steps"""
        print("\n📋 Installation Steps:")
        print("1. Chrome Extensions page should now be open")
        print("2. Enable 'Developer mode' (toggle in top-right)")
        print("3. Click 'Load unpacked' button")
        print(f"4. Select this folder: {self.extension_dir.absolute()}")
        print("5. Pin the extension to your toolbar")
        print("\n🧪 Test URLs:")
        print("- https://www.amazon.com/dp/B08N5WRWNW (Echo Dot)")
        print("- https://www.amazon.com/dp/B07ZPKBL9V (Wireless Earbuds)")
        
    def run_gui_installer(self):
        """Run GUI-based installer"""
        root = tk.Tk()
        root.title("Temu Extension Installer")
        root.geometry("600x500")
        
        # Configure style
        root.configure(bg='#f0f0f0')
        
        # Title
        title_label = tk.Label(root, text="🛒 Temu Price Comparison Extension", 
                              font=("Arial", 16, "bold"), bg='#f0f0f0')
        title_label.pack(pady=20)
        
        # Status text
        status_text = tk.Text(root, height=15, width=70, bg='white', font=("Courier", 10))
        status_text.pack(pady=10, padx=20)
        
        def log_message(message):
            status_text.insert(tk.END, message + "\n")
            status_text.see(tk.END)
            root.update()
            
        def run_installation():
            log_message("🚀 Starting installation...")
            
            # Check system
            if not self.check_system():
                log_message("❌ System check failed")
                return
                
            # Validate files
            if not self.validate_files():
                log_message("❌ File validation failed")
                return
                
            # Validate manifest
            if not self.validate_manifest():
                log_message("❌ Manifest validation failed")
                return
                
            # Create guide
            self.create_installation_guide()
            log_message("✅ Installation guide created")
            
            # Create shortcut
            self.create_desktop_shortcut()
            log_message("✅ Desktop shortcut created")
            
            # Open Chrome
            if self.open_chrome_extensions():
                log_message("✅ Chrome Extensions page opened")
            else:
                log_message("⚠️  Failed to open Chrome automatically")
                
            log_message("\n🎉 Installation completed!")
            log_message("Follow the steps shown in Chrome to complete the installation.")
            
        # Buttons
        button_frame = tk.Frame(root, bg='#f0f0f0')
        button_frame.pack(pady=20)
        
        install_button = tk.Button(button_frame, text="Install Extension", 
                                  command=run_installation, bg='#4CAF50', fg='white',
                                  font=("Arial", 12), padx=20, pady=10)
        install_button.pack(side=tk.LEFT, padx=10)
        
        exit_button = tk.Button(button_frame, text="Exit", 
                               command=root.quit, bg='#f44336', fg='white',
                               font=("Arial", 12), padx=20, pady=10)
        exit_button.pack(side=tk.LEFT, padx=10)
        
        root.mainloop()
        
    def run_cli_installer(self):
        """Run command-line installer"""
        self.print_banner()
        
        # Check system
        if not self.check_system():
            return False
            
        # Validate files
        if not self.validate_files():
            return False
            
        # Validate manifest
        if not self.validate_manifest():
            return False
            
        # Create installation guide
        self.create_installation_guide()
        
        # Create desktop shortcut
        self.create_desktop_shortcut()
        
        # Open Chrome extensions page
        self.open_chrome_extensions()
        
        # Show installation steps
        self.show_installation_steps()
        
        print("\n🎉 Automated installation process completed!")
        print("\n📚 Next steps:")
        print("1. Follow the installation steps above")
        print("2. Test the extension on Amazon product pages")
        print("3. Check the popup interface")
        print("4. Read INSTALLATION_GUIDE.md for more details")
        print("\n✅ Extension is ready for installation!")
        
        return True

def main():
    """Main function"""
    installer = TemuExtensionInstaller()
    
    # Check if GUI is requested
    if len(sys.argv) > 1 and sys.argv[1] == "--gui":
        installer.run_gui_installer()
    else:
        installer.run_cli_installer()

if __name__ == "__main__":
    main() 