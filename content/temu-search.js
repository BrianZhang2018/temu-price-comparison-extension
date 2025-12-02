// Temu Auto-Search Content Script
// Handles automatic searching on Temu/RSA pages when search_key parameter is present

console.log('🔍 Temu Auto-Search Script loaded');

class TemuAutoSearch {
  constructor() {
    this.searchAttempted = false;
    this.maxRetries = 5;
    this.retryDelay = 2000; // 2 seconds
    this.init();
  }

  init() {
    // Check if we have a search parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchKey = urlParams.get('search_key');

    // Validate search key - prevent empty string searches
    if (searchKey && searchKey.trim() !== '' && !this.searchAttempted) {
      console.log('🎯 Auto-search triggered for:', searchKey);
      this.searchAttempted = true;
      this.attemptAutoSearch(searchKey);
    } else if (searchKey && searchKey.trim() === '') {
      console.log('⚠️ Empty search key detected, skipping auto-search');
    }
  }

  async attemptAutoSearch(searchQuery) {
    console.log('🔍 Attempting auto-search for:', searchQuery);
    
    // Wait for page to load
    if (document.readyState !== 'complete') {
      await this.waitForPageLoad();
    }
    
    // Try different methods to trigger search
    let success = false;
    
    for (let attempt = 1; attempt <= this.maxRetries && !success; attempt++) {
      console.log(`🔄 Auto-search attempt ${attempt}/${this.maxRetries}`);
      
      // Method 1: Try to find and fill search input
      success = await this.fillSearchInput(searchQuery);
      
      if (!success) {
        // Method 2: Try to trigger search via URL navigation
        success = await this.navigateToSearch(searchQuery);
      }
      
      if (!success && attempt < this.maxRetries) {
        console.log(`⏳ Waiting ${this.retryDelay}ms before next attempt...`);
        await this.delay(this.retryDelay);
      }
    }
    
    if (success) {
      console.log('✅ Auto-search completed successfully');
    } else {
      console.log('❌ Auto-search failed after all attempts');
      this.showSearchSuggestion(searchQuery);
    }
  }

  async fillSearchInput(searchQuery) {
    try {
      // Common search input selectors
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="Search" i]',
        'input[name*="search" i]',
        'input[id*="search" i]',
        '.search-input',
        '#search-input',
        '.search-box input',
        'input[data-testid*="search" i]',
        'input[aria-label*="search" i]'
      ];
      
      for (const selector of searchSelectors) {
        const input = document.querySelector(selector);
        if (input && this.isVisible(input)) {
          console.log(`🎯 Found search input with selector: ${selector}`);
          
          // Focus and fill the input
          input.focus();
          input.value = searchQuery;
          
          // Trigger input events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Try to submit the form or trigger search
          const success = await this.triggerSearch(input);
          if (success) {
            return true;
          }
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error filling search input:', error);
      return false;
    }
  }

  async triggerSearch(input) {
    try {
      // Method 1: Try to find and click search button
      const searchButtons = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[aria-label*="search" i]',
        '.search-button',
        '.search-btn',
        'button:has(.search-icon)',
        'button[data-testid*="search" i]'
      ];
      
      // Look for buttons near the input
      const form = input.closest('form');
      const parent = input.parentElement;
      
      for (const selector of searchButtons) {
        // Try in form first
        let button = form?.querySelector(selector);
        if (!button) {
          // Try in parent element
          button = parent?.querySelector(selector);
        }
        if (!button) {
          // Try in document
          button = document.querySelector(selector);
        }
        
        if (button && this.isVisible(button)) {
          console.log(`🎯 Found search button with selector: ${selector}`);
          button.click();
          await this.delay(1000);
          return true;
        }
      }
      
      // Method 2: Try pressing Enter
      console.log('🔄 Trying Enter key submission');
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      
      await this.delay(1000);
      
      // Method 3: Try form submission
      if (form) {
        console.log('🔄 Trying form submission');
        form.submit();
        await this.delay(1000);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error triggering search:', error);
      return false;
    }
  }

  async navigateToSearch(searchQuery) {
    try {
      // If we're on a Temu domain, try to navigate to search results
      if (window.location.hostname.includes('temu.com')) {
        const currentUrl = new URL(window.location.href);
        const searchUrl = `${currentUrl.protocol}//${currentUrl.hostname}/search_result.html`;
        
        // Build search URL with current parameters
        const params = new URLSearchParams(currentUrl.search);
        params.set('search_key', searchQuery);
        
        const finalUrl = `${searchUrl}?${params.toString()}`;
        
        console.log('🔄 Navigating to search URL:', finalUrl);
        window.location.href = finalUrl;
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error navigating to search:', error);
      return false;
    }
  }

  showSearchSuggestion(searchQuery) {
    // Show a visual hint to the user about searching
    const notification = document.createElement('div');
    notification.id = 'temu-search-suggestion';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b35;
      color: white;
      padding: 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">🔍 Search Suggestion</div>
      <div style="font-size: 14px; margin-bottom: 12px;">
        Search for: "${searchQuery}"
      </div>
      <button onclick="this.parentElement.remove()" style="background: white; color: #ff6b35; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
        Close
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize auto-search when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TemuAutoSearch();
  });
} else {
  new TemuAutoSearch();
}

// Also try on window load as a fallback
window.addEventListener('load', () => {
  if (!window.temuAutoSearchInitialized) {
    window.temuAutoSearchInitialized = true;
    new TemuAutoSearch();
  }
});

console.log('✅ Temu Auto-Search Script initialized'); 