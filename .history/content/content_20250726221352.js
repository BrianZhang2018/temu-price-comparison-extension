// Temu Price Comparison - Content Script
// Detects Amazon product pages and extracts product information

console.log('Temu Price Comparison: Content script loaded');

// Extension simplified - scraping mode only

class AmazonProductExtractor {
  constructor() {
    this.isProductPage = false;
    this.productData = null;
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectProductPage());
    } else {
      this.detectProductPage();
    }
  }

  detectProductPage() {
    // Check if this is an Amazon product page
    const productSelectors = [
      '#dp-container',
      '#productTitle',
      '.a-price-whole',
      '[data-feature-name="productTitle"]'
    ];

    this.isProductPage = productSelectors.some(selector => 
      document.querySelector(selector)
    );

    if (this.isProductPage) {
      console.log('Temu Price Comparison: Product page detected');
      this.extractProductData();
    }
  }

  extractProductData() {
    try {
      // Extract product title
      const titleElement = document.querySelector('#productTitle') || 
                          document.querySelector('[data-feature-name="productTitle"]') ||
                          document.querySelector('h1');
      
      const title = titleElement ? titleElement.textContent.trim() : '';

      // Extract price
      const priceElement = document.querySelector('.a-price-whole') ||
                          document.querySelector('.a-price .a-offscreen') ||
                          document.querySelector('[data-a-color="price"] .a-offscreen');
      
      let price = '';
      if (priceElement) {
        price = priceElement.textContent.replace(/[^\d.]/g, '');
      }

      // Extract product image
      const imageElement = document.querySelector('#landingImage') ||
                          document.querySelector('#imgBlkFront') ||
                          document.querySelector('.a-dynamic-image');
      
      const imageUrl = imageElement ? imageElement.src : '';

      // Extract product ID from URL
      const url = window.location.href;
      const productIdMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      const productId = productIdMatch ? productIdMatch[1] : '';

      this.productData = {
        title: title,
        price: parseFloat(price) || 0,
        imageUrl: imageUrl,
        productId: productId,
        url: url,
        timestamp: Date.now()
      };

      console.log('Temu Price Comparison: Product data extracted:', this.productData);
      
      // Store product data
      this.storeProductData();
      
      // Search Temu for similar products
      this.checkAmazonProduct();

    } catch (error) {
      console.error('Temu Price Comparison: Error extracting product data:', error);
    }
  }

  storeProductData() {
    chrome.storage.local.set({
      'currentProduct': this.productData
    }, () => {
      console.log('Temu Price Comparison: Product data stored');
    });
  }

  async checkAmazonProduct() {
    if (!this.productData || !this.productData.title) {
      console.log('Temu Price Comparison: No product data available for comparison');
      return;
    }

    try {
      console.log('Temu Price Comparison: Checking Amazon product for Temu alternatives');
      
      // Set a timeout to show fallback button if background script doesn't respond
      const fallbackTimeout = setTimeout(() => {
        console.log('Temu Price Comparison: Background script timeout, showing fallback button');
        this.showFallbackButton();
      }, 5000); // 5 second timeout
      
      // Send product data to background script for processing
      chrome.runtime.sendMessage({
        action: 'checkAmazonProduct',
        productData: this.productData
      }, (response) => {
        try {
          // Clear the timeout since we got a response
          clearTimeout(fallbackTimeout);
          
          if (chrome.runtime.lastError) {
            console.error('Temu Price Comparison: Runtime error:', chrome.runtime.lastError);
            this.showFallbackButton();
            return;
          }
          
          console.log('Temu Price Comparison: Received response from background script:', response);
          
          if (response && response.success) {
            console.log('Temu Price Comparison: Received successful response:', response);
            console.log('Temu Price Comparison: Response temuProduct:', response.temuProduct);
            
            // Show price comparison with T Save button
            if (response.temuProduct) {
              console.log('Temu Price Comparison: Showing price comparison');
              this.showPriceComparison(this.productData, response.temuProduct);
            } else {
              console.log('Temu Price Comparison: No products found, showing fallback test button');
              this.showFallbackButton();
            }
          } else {
            console.log('Temu Price Comparison: No Temu product found or search failed, showing fallback test button');
            this.showFallbackButton();
          }
        } catch (error) {
          console.error('Temu Price Comparison: Error handling response:', error);
          this.showFallbackButton();
        }
      });

    } catch (error) {
      console.error('Temu Price Comparison: Error checking Amazon product:', error);
      this.showFallbackButton();
    }
  }

  createSearchQuery(title) {
    // Clean and optimize search query
    let query = title
      .replace(/amazon/i, '')
      .replace(/brand/i, '')
      .replace(/official/i, '')
      .replace(/genuine/i, '')
      .trim();
    
    // Take first 5-10 words for better matching
    const words = query.split(' ').slice(0, 8);
    return words.join(' ');
  }



  showTemuSaveButton(temuProduct) {
    // Remove existing button if present
    const existingBtn = document.getElementById('temu-save-btn');
    if (existingBtn) existingBtn.remove();
    
    // Find the price display area with savings percentage and price
    const priceDisplayArea = document.querySelector('.a-section.a-spacing-none.aok-align-center.aok-relative');
    const buyOnTemuBtn = document.querySelector('[id*="buy-on-temu"], [class*="buy-on-temu"]') || 
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.textContent.includes('Buy On Temu') || btn.textContent.includes('Buy on Temu')
                         );
    const priceBlock = document.querySelector('#corePriceDisplay_desktop_feature_div, .a-price, .a-price-whole');
    const addToCart = document.querySelector('#add-to-cart-button');
    
    let anchor = priceDisplayArea || buyOnTemuBtn || priceBlock || addToCart;
    if (!anchor) {
      console.log('Temu Price Comparison: No anchor found for save button');
      // Fallback: try to find any reasonable position
      anchor = document.querySelector('#price_inside_buybox, .a-price, .a-price-whole, #add-to-cart-button, .a-button-input');
      if (!anchor) {
        console.log('Temu Price Comparison: No fallback anchor found');
        return;
      }
    }

    // Create button
    const btn = document.createElement('button');
    btn.id = 'temu-save-btn';
    btn.style.cssText = `
      display: flex; align-items: center; gap: 6px;
      background: #228B22;
      color: #fff;
      border: none;
      border-radius: 999px;
      font-weight: bold;
      font-size: 18px;
      padding: 6px 18px 6px 12px;
      margin-top: 10px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.10);
      z-index: 10001;
    `;
    btn.innerHTML = `<span style="font-size: 22px; font-family: inherit; font-weight: 900;">T</span> Save $${(temuProduct.savings || 0).toFixed(0)}`;

    // Popup
    let popup = null;
    
    btn.addEventListener('mouseenter', () => {
      if (popup) popup.remove();
      popup = this.createTemuPopup(temuProduct, btn);
      document.body.appendChild(popup);
      const rect = btn.getBoundingClientRect();
      popup.style.position = 'absolute';
      popup.style.left = `${rect.right + window.scrollX + 8}px`;
      popup.style.top = `${rect.top + window.scrollY}px`;
    });

    // Insert near the price display area or fallback to other positions
    if (priceDisplayArea && priceDisplayArea.parentNode) {
      // Insert after the price display area
      priceDisplayArea.parentNode.insertBefore(btn, priceDisplayArea.nextSibling);
      console.log('Temu Price Comparison: Inserted save button near price display area');
    } else if (buyOnTemuBtn && buyOnTemuBtn.parentNode) {
      // Replace the "Buy On Temu" button position
      buyOnTemuBtn.parentNode.insertBefore(btn, buyOnTemuBtn);
      // Optionally hide the original "Buy On Temu" button
      buyOnTemuBtn.style.display = 'none';
      console.log('Temu Price Comparison: Inserted save button near Buy On Temu button');
    } else if (priceBlock && priceBlock.parentNode) {
      priceBlock.parentNode.insertBefore(btn, priceBlock.nextSibling);
      console.log('Temu Price Comparison: Inserted save button near price block');
    } else if (addToCart && addToCart.parentNode) {
      addToCart.parentNode.insertBefore(btn, addToCart);
      console.log('Temu Price Comparison: Inserted save button near Add to Cart');
    } else {
      document.body.appendChild(btn);
      console.log('Temu Price Comparison: Inserted save button to body');
    }
  }

  createTemuPopup(temuProduct, btn) {
    const amazonPrice = this.productData.price;
    const temuPrice = temuProduct.price || 0;
    const savings = amazonPrice - temuPrice;
    const savingsPercent = amazonPrice > 0 ? ((savings / amazonPrice) * 100).toFixed(1) : 0;
    const popup = document.createElement('div');
    popup.id = 'temu-popup';
    popup.style.cssText = `
      min-width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      z-index: 10002;
      transition: all 0.3s ease;
      overflow: hidden;
    `;
    popup.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          font-size: 16px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        ">Temu Price Comparison</div>
        <button id="temu-popup-close" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          transition: background 0.2s ease;
        ">×</button>
      </div>
      <div style="padding: 16px;">
        <div style="
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
          color: white;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
        ">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">
            Save $${savings.toFixed(2)}
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            ${savingsPercent}% off
          </div>
        </div>
        <div style="
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid #e9ecef;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: #2c3e50; font-weight: 500;">Amazon:</span>
            <span style="color: #2c3e50; font-weight: 700; font-size: 16px;">$${amazonPrice.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2c3e50; font-weight: 500;">Temu:</span>
            <span style="color: #e74c3c; font-weight: 700; font-size: 16px;">$${temuPrice.toFixed(2)}</span>
          </div>
        </div>
        <button id="temu-popup-buy" style="
          width: 100%;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        ">Buy on Temu</button>
      </div>
    `;
    
    // Add hover effects
    const closeBtn = popup.querySelector('#temu-popup-close');
    const buyBtn = popup.querySelector('#temu-popup-buy');
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    buyBtn.addEventListener('mouseenter', () => {
      buyBtn.style.transform = 'translateY(-1px)';
      buyBtn.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
    });
    buyBtn.addEventListener('mouseleave', () => {
      buyBtn.style.transform = 'translateY(0)';
      buyBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
    });
    
    // Button actions
    buyBtn.onclick = () => {
      console.log('Temu Price Comparison: 🚀 USER CLICKED "Buy on Temu"');
      console.log('Temu Price Comparison: Getting working search URL for temuProduct');
      
      // Get working search URL instead of using potentially outdated temuProduct.url
      const productQuery = this.createSearchQuery(this.productData.title);
      
      getWorkingTemuSearchUrl(productQuery).then(workingUrl => {
        console.log('Temu Price Comparison: Redirecting to working URL:', workingUrl);
      console.log('Temu Price Comparison: Product title:', temuProduct.title);
      console.log('Temu Price Comparison: Product price: $' + temuProduct.price);
        
        // Use chrome.tabs.create instead of window.open to avoid popup blockers
        chrome.runtime.sendMessage({
          action: 'openTab',
          url: workingUrl
        }, (response) => {
          if (response && response.success) {
            console.log('Temu Price Comparison: ✅ Working search tab opened successfully');
          } else {
            console.error('Temu Price Comparison: ❌ Failed to open working search tab');
            // Fallback to window.open if chrome.tabs fails
            window.open(workingUrl, '_blank');
          }
        });
        
      }).catch(error => {
        console.error('Temu Price Comparison: Failed to get working search URL:', error);
        
        // Fallback: Use basic search URL
        const fallbackUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(productQuery)}`;
        chrome.runtime.sendMessage({
          action: 'openTab',
          url: fallbackUrl
        }, (response) => {
          if (response && response.success) {
            console.log('Temu Price Comparison: ✅ Fallback search tab opened successfully');
          } else {
            console.error('Temu Price Comparison: ❌ Failed to open fallback search tab');
            // Last resort fallback to window.open
            window.open(fallbackUrl, '_blank');
          }
        });
      });
    };
    
    // Close button action
    closeBtn.onclick = () => {
      popup.remove();
      popup = null;
    };
    
    return popup;
  }



  showPriceComparison(amazonProduct, temuProduct) {
    console.log('Temu Price Comparison: Showing price comparison popup');
    
    const amazonPrice = parseFloat(amazonProduct.price.replace(/[^0-9.]/g, ''));
    const temuPrice = parseFloat(temuProduct.price.replace(/[^0-9.]/g, ''));
    const savings = amazonPrice - temuPrice;
    const savingsPercent = Math.round((savings / amazonPrice) * 100);
    
    // Create popup element
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      z-index: 10002;
      transition: all 0.3s ease;
      overflow: hidden;
    `;
    popup.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          font-size: 16px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        ">Temu Price Comparison</div>
        <button id="temu-popup-close" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          transition: background 0.2s ease;
        ">×</button>
      </div>
      <div style="padding: 16px;">
        <div style="
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
          color: white;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
        ">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">
            Save $${savings.toFixed(2)}
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            ${savingsPercent}% off
          </div>
        </div>
        <div style="
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid #e9ecef;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: #2c3e50; font-weight: 500;">Amazon:</span>
            <span style="color: #2c3e50; font-weight: 700; font-size: 16px;">$${amazonPrice.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #2c3e50; font-weight: 500;">Temu:</span>
            <span style="color: #e74c3c; font-weight: 700; font-size: 16px;">$${temuPrice.toFixed(2)}</span>
          </div>
        </div>
        <button id="temu-popup-buy" style="
          width: 100%;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        ">Buy on Temu</button>
      </div>
    `;
    
    // Add hover effects
    const closeBtn = popup.querySelector('#temu-popup-close');
    const buyBtn = popup.querySelector('#temu-popup-buy');
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    buyBtn.addEventListener('mouseenter', () => {
      buyBtn.style.transform = 'translateY(-1px)';
      buyBtn.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
    });
    buyBtn.addEventListener('mouseleave', () => {
      buyBtn.style.transform = 'translateY(0)';
      buyBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
    });
    
    // Close button action
    closeBtn.onclick = () => {
      popup.remove();
    };
    
    // UPDATE: Get working search URL from background script for Buy button
    const productQuery = this.createSearchQuery(amazonProduct.title);
    
    getWorkingTemuSearchUrl(productQuery).then(workingUrl => {
      console.log('Temu Price Comparison: Got working URL for Buy button:', workingUrl);
      
      // Update button click handler with working URL
      popup.querySelector('#temu-popup-buy').onclick = () => {
        console.log('Temu Price Comparison: 🚀 USER CLICKED "Buy on Temu"');
        console.log('Temu Price Comparison: Redirecting to working URL:', workingUrl);
        console.log('Temu Price Comparison: Product title:', amazonProduct.title);
        console.log('Temu Price Comparison: Product price: $' + amazonProduct.price);
        
        // Use chrome.tabs.create instead of window.open to avoid popup blockers
        chrome.runtime.sendMessage({
          action: 'openTab',
          url: workingUrl
        }, (response) => {
          if (response && response.success) {
            console.log('Temu Price Comparison: ✅ Working search tab opened successfully');
          } else {
            console.error('Temu Price Comparison: ❌ Failed to open working search tab');
            // Fallback to window.open if chrome.tabs fails
            window.open(workingUrl, '_blank');
          }
        });
      };
    }).catch(error => {
      console.error('Temu Price Comparison: Failed to get working search URL:', error);
      // Fallback button click handler
      popup.querySelector('#temu-popup-buy').onclick = () => {
        console.log('Temu Price Comparison: 🚀 USER CLICKED "Buy on Temu" (fallback)');
        const fallbackUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(productQuery)}`;
        
        // Use chrome.tabs.create for fallback too
        chrome.runtime.sendMessage({
          action: 'openTab',
          url: fallbackUrl
        }, (response) => {
          if (response && response.success) {
            console.log('Temu Price Comparison: ✅ Fallback search tab opened successfully');
          } else {
            console.error('Temu Price Comparison: ❌ Failed to open fallback search tab');
            // Last resort fallback to window.open
            window.open(fallbackUrl, '_blank');
          }
        });
      };
    });
    
    // Add to page
    document.body.appendChild(popup);
    console.log('Temu Price Comparison: Price comparison popup displayed');
  }

  showFallbackButton() {
    console.log('Temu Price Comparison: Showing fallback test button');
    
    if (!this.productData || !this.productData.price) {
      console.log('Temu Price Comparison: No product data available for fallback button');
      return;
    }
    
    const amazonPrice = this.productData.price;
    const estimatedTemuPrice = amazonPrice * 0.7; // Estimate 30% cheaper
    const estimatedSavings = amazonPrice - estimatedTemuPrice;
    
    // UPDATE: Get working search URL from background script instead of hardcoded RSA URL
    const productQuery = this.createSearchQuery(this.productData.title);
    
    getWorkingTemuSearchUrl(productQuery).then(workingUrl => {
      console.log('Temu Price Comparison: Got working URL for fallback button:', workingUrl);
      
      // Show fallback button with working URL
      this.showTemuSaveButton({
        price: estimatedTemuPrice,
        url: workingUrl,  // Use working search URL
        savings: estimatedSavings
      });
    }).catch(error => {
      console.error('Temu Price Comparison: Failed to get working search URL for fallback:', error);
      
      // Show fallback button with basic search URL
      const fallbackUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(productQuery)}`;
      this.showTemuSaveButton({
        price: estimatedTemuPrice,
        url: fallbackUrl,
        savings: estimatedSavings
      });
    });
  }


}

// NEW: Display automatic search results popup
function showSearchResultsPopup(amazonProduct, bestMatch, searchUrl) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 350px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    border: 2px solid rgba(255,255,255,0.2);
  `;
  
  const amazonPrice = typeof amazonProduct.price === 'string' ? 
    parseFloat(amazonProduct.price.replace(/[^0-9.]/g, '')) : 
    parseFloat(amazonProduct.price) || 0;
  const temuPrice = parseFloat(bestMatch.price.replace(/[^0-9.]/g, ''));
  const savings = amazonPrice > temuPrice ? ((amazonPrice - temuPrice) / amazonPrice * 100).toFixed(0) : 0;
  
  popup.innerHTML = `
    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; display: flex; align-items: center;">
      <span style="margin-right: 8px;">🎯</span>
      <span>Found Match on Temu!</span>
    </div>
    <div style="font-size: 13px; margin-bottom: 8px; opacity: 0.9;">
      <strong>Amazon:</strong> ${amazonProduct.title.substring(0, 35)}${amazonProduct.title.length > 35 ? '...' : ''}
    </div>
    <div style="font-size: 13px; margin-bottom: 12px; opacity: 0.9;">
      <strong>Temu:</strong> ${bestMatch.title.substring(0, 35)}${bestMatch.title.length > 35 ? '...' : ''}
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
      <span>Amazon: <strong>$${amazonPrice.toFixed(2)}</strong></span>
      <span style="color: #00ff88; font-weight: bold;">Temu: <strong>${bestMatch.price}</strong></span>
    </div>
    ${savings > 0 ? `
      <div style="text-align: center; color: #ffff88; font-weight: bold; margin-bottom: 12px; font-size: 15px;">
        💰 Save ${savings}%!
      </div>
    ` : ''}
    <div style="display: flex; gap: 8px; margin-top: 12px;">
      <button id="view-search-results" style="
        flex: 1;
        background: white; 
        color: #ff6b35; 
        border: none; 
        padding: 10px 12px; 
        border-radius: 6px; 
        cursor: pointer; 
        font-weight: bold;
        font-size: 12px;
        transition: all 0.2s ease;
      ">
        View Search Results
      </button>
      <button id="buy-now-temu" style="
        flex: 1;
        background: rgba(255,255,255,0.2); 
        color: white; 
        border: 1px solid rgba(255,255,255,0.3); 
        padding: 10px 12px; 
        border-radius: 6px; 
        cursor: pointer; 
        font-weight: bold;
        font-size: 12px;
        transition: all 0.2s ease;
      ">
        Buy This Item
      </button>
    </div>
    <button id="close-search-popup" style="
      position: absolute; 
      top: 5px; 
      right: 8px; 
      background: none; 
      border: none; 
      color: white; 
      font-size: 18px; 
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    ">×</button>
  `;
  
  // Event listeners
  popup.querySelector('#view-search-results').onclick = () => {
    window.open(searchUrl, '_blank');
    popup.remove();
  };
  
  popup.querySelector('#buy-now-temu').onclick = () => {
    if (bestMatch.affiliateUrl) {
      window.open(bestMatch.affiliateUrl, '_blank');
    } else {
      window.open(searchUrl, '_blank');
    }
    popup.remove();
  };
  
  popup.querySelector('#close-search-popup').onclick = () => {
    popup.remove();
  };
  
  // Hover effects
  popup.querySelector('#view-search-results').onmouseenter = function() {
    this.style.background = '#f0f0f0';
  };
  popup.querySelector('#view-search-results').onmouseleave = function() {
    this.style.background = 'white';
  };
  
  popup.querySelector('#buy-now-temu').onmouseenter = function() {
    this.style.background = 'rgba(255,255,255,0.3)';
  };
  popup.querySelector('#buy-now-temu').onmouseleave = function() {
    this.style.background = 'rgba(255,255,255,0.2)';
  };
  
  popup.querySelector('#close-search-popup').onmouseenter = function() {
    this.style.opacity = '1';
  };
  popup.querySelector('#close-search-popup').onmouseleave = function() {
    this.style.opacity = '0.7';
  };
  
  document.body.appendChild(popup);
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (popup.parentNode) popup.remove();
  }, 15000);
  
  console.log('Temu Price Comparison: Search results popup displayed');
}

// NEW: Function to get working Temu search URL from background script
async function getWorkingTemuSearchUrl(productTitle) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'generateWorkingSearchUrl',
      productTitle: productTitle
    }, (response) => {
      if (response && response.success) {
        console.log('Temu Price Comparison: Got working search URL:', response.searchUrl);
        resolve(response.searchUrl);
      } else {
        console.log('Temu Price Comparison: Failed to get working search URL, using fallback');
        // Fallback to basic search URL
        const cleanTitle = productTitle.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        resolve(`https://www.temu.com/search_result.html?search_key=${encodeURIComponent(cleanTitle)}`);
      }
    });
  });
}

// Proper affiliate flow handler
function handleBuyOnTemuClick(item) {
  try {
    console.log('Temu Price Comparison: Buy on Temu clicked for item:', item.title);
    
    // Step 1: Get working search URL instead of RSA link
    const extractor = window.amazonProductExtractor;
    
    if (extractor && extractor.productData && extractor.productData.title) {
      const productQuery = extractor.createSearchQuery(extractor.productData.title);
      console.log('Temu Price Comparison: Getting working search URL for:', productQuery);
      
      // Get working search URL from background script
      getWorkingTemuSearchUrl(productQuery).then(workingUrl => {
        console.log('Temu Price Comparison: Opening working search URL:', workingUrl);
        
        // Open the working search URL directly
    chrome.runtime.sendMessage({
      action: 'openTab',
          url: workingUrl
    }, (response) => {
          if (response && response.success) {
            console.log('Temu Price Comparison: Working search tab opened successfully');
          } else {
            console.error('Temu Price Comparison: Failed to open working search tab');
          }
        });
        
      }).catch(error => {
        console.error('Temu Price Comparison: Failed to get working search URL:', error);
        
        // Fallback: Open basic search URL
        const fallbackUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(productQuery)}`;
      chrome.runtime.sendMessage({
          action: 'openTab',
          url: fallbackUrl
        });
      });
      
          } else {
      console.log('Temu Price Comparison: No product data available, opening Temu homepage');
      // Fallback: Open Temu homepage
      chrome.runtime.sendMessage({
        action: 'openTab',
        url: 'https://www.temu.com'
      });
    }
    
  } catch (error) {
    console.error('Temu Price Comparison: Error in handleBuyOnTemuClick:', error);
  }
}

// NEW: Affiliate comparison popup
function showAffiliateComparisonPopup(amazonProduct, temuProduct) {
  try {
    console.log('Temu Price Comparison: Showing affiliate comparison popup');
    
    if (!temuProduct) {
      console.log('Temu Price Comparison: No cheaper Temu product found');
      return;
    }
    
    // Calculate savings
    const amazonPrice = parseFloat(amazonProduct.price?.replace(/[^0-9.]/g, '') || '0');
    const temuPrice = parseFloat(temuProduct.price?.replace(/[^0-9.]/g, '') || '0');
    const savings = amazonPrice - temuPrice;
    const savingsPercent = amazonPrice > 0 ? ((savings / amazonPrice) * 100).toFixed(1) : 0;
    
    // Create comparison popup with affiliate context
    const popup = document.createElement('div');
    popup.className = 'temu-comparison-popup affiliate-aware';
    popup.innerHTML = `
      <div class="comparison-header">
        <h3>💰 Better Deal Found!</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="comparison-content">
        <div class="amazon-section">
          <h4>Amazon</h4>
          <p class="product-title">${amazonProduct.title}</p>
          <p class="price">$${amazonPrice.toFixed(2)}</p>
        </div>
        <div class="vs-divider">VS</div>
        <div class="temu-section">
          <h4>Temu (Affiliate Deal)</h4>
          <p class="product-title">${temuProduct.title}</p>
          <p class="price cheaper">$${temuPrice.toFixed(2)}</p>
          <p class="savings">Save $${savings.toFixed(2)} (${savingsPercent}%)</p>
        </div>
      </div>
      <div class="comparison-actions">
        <button class="buy-temu-btn affiliate-btn">
          🛒 Buy on Temu (Affiliate Reward)
        </button>
      </div>
    `;
    
    // Add styles for affiliate-aware popup
    const style = document.createElement('style');
    style.textContent = `
      .temu-comparison-popup.affiliate-aware {
        border: 2px solid #ff6b35;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
      }
      .comparison-header h3 {
        color: #ff6b35;
      }
      .temu-section {
        background: linear-gradient(135deg, #ff6b35, #ff8c42);
        color: white;
        border-radius: 8px;
        padding: 15px;
      }
      .price.cheaper {
        color: #00ff88;
        font-weight: bold;
        font-size: 1.2em;
      }
      .savings {
        color: #ffff88;
        font-weight: bold;
      }
      .buy-temu-btn.affiliate-btn {
        background: linear-gradient(135deg, #ff6b35, #ff8c42);
        border: none;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .buy-temu-btn.affiliate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
      }
    `;
    
    if (!document.querySelector('.affiliate-comparison-styles')) {
      style.className = 'affiliate-comparison-styles';
      document.head.appendChild(style);
    }
    
    // Add event listeners
    popup.querySelector('.close-btn').addEventListener('click', () => {
      popup.remove();
    });
    
    popup.querySelector('.buy-temu-btn.affiliate-btn').addEventListener('click', () => {
      handleBuyOnTemuClick(temuProduct);
      popup.remove();
    });
    
    // Insert popup into page
    document.body.appendChild(popup);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 15000);
    
    console.log('Temu Price Comparison: Affiliate comparison popup displayed');
    
  } catch (error) {
    console.error('Temu Price Comparison: Error showing affiliate comparison popup:', error);
  }
}

// Initialize the extractor
console.log('Temu Price Comparison: Content script loaded');
new AmazonProductExtractor();

// Test functions for content script
window.AmazonProductExtractor = AmazonProductExtractor;

// Test function to manually trigger T Save button
window.testSaveButton = function() {
  console.log('🧪 Testing T Save button manually...');
  
  const testProduct = {
    title: 'Test Product - Wireless Bluetooth Headphones',
    price: 49.99,
    imageUrl: '',
    productId: 'TEST123',
    url: window.location.href,
    timestamp: Date.now()
  };
  
  const testTemuProduct = {
    title: 'Similar Wireless Bluetooth Headphones',
    price: 19.99,
    url: 'https://www.temu.com/search_result.html?search_key=wireless%20bluetooth%20headphones&_x_ads_channel=kol_affiliate&_x_campaign=affiliate&_x_cid=2000534466kol_affiliate',
    savings: 30.00
  };
  
  const extractor = new AmazonProductExtractor();
  extractor.productData = testProduct;
  extractor.showPriceComparison(testProduct, testTemuProduct);
  
  console.log('✅ Manual T Save button test completed');
};

// Test function to check if save button exists
window.checkSaveButton = function() {
  const btn = document.getElementById('temu-save-btn');
  if (btn) {
    console.log('✅ T Save button found:', btn);
    console.log('Button text:', btn.textContent);
    console.log('Button style:', window.getComputedStyle(btn));
    return true;
  } else {
    console.log('❌ T Save button not found');
    return false;
  }
};

// Get affiliate hot items from storage
async function getAffiliateHotItems() {
  try {
    const data = await chrome.storage.local.get(['affiliateHotItems']);
    return data.affiliateHotItems || [];
  } catch (error) {
    console.error('Temu Price Comparison: Error getting affiliate hot items:', error);
    return [];
  }
}

// Show hot items with affiliate comparison
async function showHotItems(amazonProduct) {
  try {
    console.log('Temu Price Comparison: Showing hot items with affiliate comparison...');
    
    // Get affiliate hot items from storage
    const affiliateItems = await getAffiliateHotItems();
    console.log('Temu Price Comparison: Retrieved affiliate items:', affiliateItems.length);
    
    if (affiliateItems.length > 0) {
      // Create and show affiliate comparison UI
      const comparisonUI = createAffiliateComparisonUI(amazonProduct, affiliateItems);
      document.body.appendChild(comparisonUI);
      console.log('Temu Price Comparison: Displayed affiliate comparison UI');
    } else {
      // Fallback to original hot items display
      console.log('Temu Price Comparison: No affiliate items, using fallback display');
      showOriginalHotItems(amazonProduct);
    }
  } catch (error) {
    console.error('Temu Price Comparison: Error showing hot items:', error);
    // Fallback to original display
    showOriginalHotItems(amazonProduct);
  }
}

// Original hot items display (fallback)
function showOriginalHotItems(amazonProduct) {
  chrome.runtime.sendMessage({ action: 'getHotItems' }, (response) => {
    if (response && response.success && response.hotItems && response.hotItems.length > 0) {
      console.log('Temu Price Comparison: Received hot items:', response.hotItems.length);
      
      const container = document.createElement('div');
      container.className = 'temu-price-comparison-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 500px;
        background: white;
        border: 2px solid #ff6b35;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        overflow-y: auto;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        padding: 15px;
        border-radius: 8px 8px 0 0;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
      `;
      header.textContent = '🔥 Temu Hot Items';
      container.appendChild(header);

      response.hotItems.slice(0, 5).forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s ease;
        `;
        
        itemDiv.onmouseenter = () => {
          itemDiv.style.backgroundColor = '#f8f9fa';
        };
        
        itemDiv.onmouseleave = () => {
          itemDiv.style.backgroundColor = 'white';
        };

        const itemImage = document.createElement('img');
        itemImage.src = item.imageUrl;
        itemImage.style.cssText = `
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          margin-right: 15px;
        `;
        itemImage.onerror = () => {
          itemImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zMCAzMEMzNi42MjcgMzAgNDIgMzUuMzcyNiA0MiA0MkM0MiA0OC42Mjc0IDM2LjYyNyA1NCAzMCA1NEMyMy4zNzI2IDU0IDE4IDQ4LjYyNzQgMTggNDJDMTggMzUuMzcyNiAyMy4zNzI2IDMwIDMwIDMwWiIgZmlsbD0iI0ZGNkIzNSIvPgo8L3N2Zz4K';
        };

        const itemInfo = document.createElement('div');
        itemInfo.style.cssText = `
          flex: 1;
        `;
        
        const itemTitle = document.createElement('div');
        itemTitle.style.cssText = `
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          font-size: 14px;
          line-height: 1.3;
        `;
        itemTitle.textContent = item.title;
        
        const itemPrice = document.createElement('div');
        itemPrice.style.cssText = `
          font-size: 18px;
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 3px;
        `;
        itemPrice.textContent = `$${item.price}`;
        
        const itemSavings = document.createElement('div');
        itemSavings.style.cssText = `
          font-size: 12px;
          color: #28a745;
          font-weight: bold;
        `;
        itemSavings.textContent = `Save ${item.savings}%`;

        const buyButton = document.createElement('button');
        buyButton.textContent = 'Buy on Temu';
        buyButton.style.cssText = `
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        `;
        
        buyButton.onmouseenter = () => {
          buyButton.style.transform = 'scale(1.05)';
        };
        
        buyButton.onmouseleave = () => {
          buyButton.style.transform = 'scale(1)';
        };
        
        buyButton.onclick = () => {
          handleBuyOnTemuClick(item);
        };

        itemInfo.appendChild(itemTitle);
        itemInfo.appendChild(itemPrice);
        itemInfo.appendChild(itemSavings);
        itemDiv.appendChild(itemImage);
        itemDiv.appendChild(itemInfo);
        itemDiv.appendChild(buyButton);
        container.appendChild(itemDiv);
      });

      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      `;
      closeButton.onclick = () => {
        document.body.removeChild(container);
      };
      container.appendChild(closeButton);

      document.body.appendChild(container);
      console.log('Temu Price Comparison: Hot items displayed');
    } else {
      console.log('Temu Price Comparison: No hot items received or empty response');
    }
  });
}

console.log('🧪 Content script test functions loaded:');
console.log('   testSaveButton() - Manually trigger T Save button');
console.log('   checkSaveButton() - Check if T Save button exists'); 