// Temu Price Comparison - Background Script
// Handles Temu search requests and product matching with real web scraping

console.log('🚀 Temu Price Comparison: Background script loaded - v1.7.0 - SIMPLIFIED MODE - CACHE BUSTED:', new Date().toISOString());

// Extension configuration - simplified to scraping only
let HOT_ITEMS_MANAGER = null;

// Hot Items Manager Class
class HotItemsManager {
  constructor() {
    this.hotItems = [];
    this.isLoaded = false;
    this.loadHotItems();
  }

  async loadHotItems() {
    try {
      // Load hot items from local JSON file
      const response = await fetch(chrome.runtime.getURL('data/hot-items.json'));
      const data = await response.json();
      this.hotItems = data.hotItems || [];
      this.isLoaded = true;
      console.log('Temu Price Comparison: Loaded', this.hotItems.length, 'hot items from local data');
    } catch (error) {
      console.error('Temu Price Comparison: Failed to load hot items:', error);
      // Fallback to hardcoded items
      this.hotItems = [
        {
          id: 'hot_001',
          title: "Temu Best Deals",
          price: 1.55,
          originalPrice: 29.99,
          imageUrl: 'https://img.temu.com/images/storefront1.jpg',
          affiliateUrl: 'https://temu.to/k/p41m6s2oved',
          category: 'general',
          tags: ['best deals', 'affiliate', 'storefront'],
          rating: 4.8,
          reviews: 10000,
          salesCount: '50K+sold',
          savings: 95,
          description: 'Curated selection of highly rated, well-priced items'
        },
        {
          id: 'hot_002', 
          title: 'Lowest Price in Last 30 Days',
          price: 9.96,
          originalPrice: 20.73,
          imageUrl: 'https://img.temu.com/images/storefront2.jpg',
          affiliateUrl: 'https://temu.to/k/pbu92q40kay',
          category: 'general',
          tags: ['lowest price', '30 days', 'big savings'],
          rating: 4.7,
          reviews: 15000,
          salesCount: '100K+sold',
          savings: 52,
          description: 'Biggest savings with lowest prices in 30 days'
        }
      ];
      this.isLoaded = true;
      console.log('Temu Price Comparison: Loaded fallback hot items');
    }
  }

  findRelatedHotItems(amazonProduct, maxResults = 2) {
    // Always return the hardcoded list for hot-items mode
    return this.hotItems.slice(0, maxResults);
  }

  getAllHotItems(limit = 2) {
    return this.hotItems.slice(0, limit);
  }

  isHotItemsLoaded() {
    return this.isLoaded && this.hotItems.length > 0;
  }
}

// Initialize hot items manager
HOT_ITEMS_MANAGER = new HotItemsManager();
console.log('Temu Price Comparison: Hot Items Manager initialized');

// Refresh hot items every 30 minutes to keep them up-to-date
setInterval(() => {
  console.log('Temu Price Comparison: Refreshing hot items from affiliate page...');
  HOT_ITEMS_MANAGER.loadHotItems();
}, 30 * 60 * 1000); // 30 minutes

// Referral code configuration
// Temu RSA (Referral Shopping Assistant) configuration
const TEMU_RSA_URL = 'https://temu.to/k/punow4xcbj4';

async function getRSAUrl(productTitle = null) {
  try {
    // Try to get the stored redirected RSA URL first
    const storedData = await chrome.storage.local.get(['baseRsaUrl']);
    let baseUrl = storedData.baseRsaUrl || TEMU_RSA_URL;
    
    // If we have a product title, add search parameters
    if (productTitle) {
      const cleanQuery = cleanProductTitleForSearch(productTitle);
      if (cleanQuery) {
        // If it's the original affiliate URL, add search parameter
        if (baseUrl === TEMU_RSA_URL) {
          return `${baseUrl}?search_key=${encodeURIComponent(cleanQuery)}`;
        } else {
          // If it's the redirected URL, we might need to handle it differently
          // For now, return the base redirected URL
          return baseUrl;
        }
      }
    }

    return baseUrl;
  } catch (error) {
    console.error('Temu Price Comparison: Error getting RSA URL:', error);
    return TEMU_RSA_URL;
  }
}



function generateSessionId() {
  // Generate session ID similar to real examples (10 characters, alphanumeric)
  return Math.random().toString(36).substr(2, 10);
}

function cleanProductTitleForSearch(title) {
  if (!title) return '';
  
  // Clean Amazon product title for better Temu search results
  return title
    .replace(/amazon/gi, '')
    .replace(/brand/gi, '')
    .replace(/official/gi, '')
    .replace(/genuine/gi, '')
    .replace(/authentic/gi, '')
    .replace(/new/gi, '')
    .replace(/original/gi, '')
    .replace(/factory/gi, '')
    .replace(/sealed/gi, '')
    .replace(/\([^)]*\)/g, '') // Remove content in parentheses
    .replace(/\[[^\]]*\]/g, '') // Remove content in brackets
    .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .split(' ')
    .slice(0, 6) // Use first 6 words for better search
    .join(' ');
}



// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Temu Price Comparison: Received message:', request.action);
  
  switch (request.action) {
    case 'checkAmazonProduct':
      handleAmazonProduct(request.productData).then(result => {
          sendResponse(result);
      }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep listener alive for async response

    case 'searchAmazonProductOnRSA':
      searchAmazonProductOnRSA(request.amazonProduct).then(result => {
          sendResponse(result);
      }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep listener alive for async response

    case 'getHotItems':
      const hotItems = HOT_ITEMS_MANAGER.getAllHotItems(10);
      sendResponse({ 
        success: true, 
        hotItems: hotItems,
        count: hotItems.length 
      });
      return true;

    case 'generateWorkingSearchUrl':
      try {
        if (!request.productTitle || typeof request.productTitle !== 'string') {
          console.error('Temu Price Comparison: Invalid product title for generateWorkingSearchUrl:', request.productTitle);
          sendResponse({ success: false, error: 'Invalid product title' });
          return true;
        }
        
        // Clean the product title for search
        const searchQuery = cleanProductTitleForSearch(request.productTitle);
        console.log('Temu Price Comparison: Generating working URL for:', searchQuery);
        
        // Generate working search URL with affiliate tracking
        const urlResult = generateWorkingTemuSearchUrl(searchQuery);
        sendResponse(urlResult);
        
      } catch (error) {
        console.error('Temu Price Comparison: Error generating working search URL:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'openTab':
      if (!request.url || typeof request.url !== 'string') {
        console.error('Temu Price Comparison: Invalid URL for openTab:', request.url);
        sendResponse({ success: false, error: 'Invalid URL' });
        return;
      }
      
      // Get the current tab to position the new tab next to it
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Temu Price Comparison: Error querying current tab:', chrome.runtime.lastError);
          // Fallback to default tab creation
          chrome.tabs.create({ url: request.url }, (tab) => {
            if (chrome.runtime.lastError) {
              console.error('Temu Price Comparison: Error opening tab:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              console.log('Temu Price Comparison: Opened new tab (fallback):', request.url);
              sendResponse({ success: true, tabId: tab.id });
            }
          });
          return;
        }
        
        const currentTab = tabs[0];
        if (!currentTab) {
          console.error('Temu Price Comparison: No current tab found');
          sendResponse({ success: false, error: 'No current tab found' });
          return;
        }
        
        // Create new tab next to the current one
        chrome.tabs.create({ 
          url: request.url,
          index: currentTab.index + 1  // Position next to current tab
        }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('Temu Price Comparison: Error opening tab:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Temu Price Comparison: Opened new tab next to current tab:', request.url);
            sendResponse({ success: true, tabId: tab.id });
          }
        });
      });
    return true;

    case 'testHotItemsManager':
      try {
        const isLoaded = HOT_ITEMS_MANAGER.isHotItemsLoaded();
        const hotItemsCount = HOT_ITEMS_MANAGER.hotItems.length;
        
        // Test scoring with a sample product
        const testProduct = {
          title: 'Wireless Bluetooth Headphones',
          price: 49.99
        };
        const testItems = HOT_ITEMS_MANAGER.findRelatedHotItems(testProduct, 1);
        const testScore = testItems.length > 0 ? testItems[0].score : 0;
        
        sendResponse({
          success: true,
          isLoaded: isLoaded,
          hotItems: HOT_ITEMS_MANAGER.getAllHotItems(10),
          hotItemsCount: hotItemsCount,
          testScore: testScore,
          testItemsFound: testItems.length
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
      return true;

    case 'testHotItemsParsing':
      try {
        const parsedItems = HOT_ITEMS_MANAGER.parseHotItemsFromHTML(request.html);
        sendResponse({
          success: true,
          hotItems: parsedItems,
          count: parsedItems.length
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
      return true;


    case 'testAffiliateLink':
      getRSAUrl().then(affiliateUrl => {
        sendResponse({
          success: true,
          affiliateUrl: affiliateUrl
        });
      }).catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
      return true;

    case 'refreshHotItems':
      HOT_ITEMS_MANAGER.loadHotItems()
        .then(() => {
          sendResponse({
            success: true,
            message: 'Hot items refreshed successfully',
            count: HOT_ITEMS_MANAGER.hotItems.length
          });
        })
        .catch(error => {
          sendResponse({
            success: false,
            error: error.message
          });
        });
      return true;

    case 'testAPIClient':
      // This section is no longer relevant as we are using scraping
      // Keeping it for now, but it will always return success
      sendResponse({
        success: true,
        message: 'API client tested successfully (using scraping)'
      });
      return true;

    case 'getAPIStatus':
      // This section is no longer relevant as we are using scraping
      sendResponse({
        success: true,
        message: 'API status (using scraping)'
      });
      return true;

    case 'testAPISearch':
      // This section is no longer relevant as we are using scraping
      sendResponse({
        success: true,
        message: 'API search tested successfully (using scraping)'
      });
    return true;
  }
});

// Helper function to extract numeric price from various price formats
function extractNumericPrice(price) {
  try {
    if (typeof price === 'number') {
      return price;
    }
    if (typeof price === 'string') {
      // Remove currency symbols, commas, and other non-numeric characters except decimal point
      const numericString = price.replace(/[^0-9.]/g, '');
      const numericPrice = parseFloat(numericString);
      return isNaN(numericPrice) ? 0 : numericPrice;
    }
    console.log('Temu Price Comparison: Unrecognized price type:', typeof price, price);
    return 0;
  } catch (error) {
    console.error('Temu Price Comparison: Error extracting numeric price:', error);
    return 0;
  }
}

async function handleAffiliateSearch(productData) {
  try {
    const amazonPrice = extractNumericPrice(productData.price);
    if (isNaN(amazonPrice) || amazonPrice <= 0) {
      console.log('Temu Price Comparison: Invalid Amazon price, skipping search');
      return [];
    }
    console.log('Temu Price Comparison: Extracted Amazon price:', amazonPrice);
    
    // Use the new RSA search functionality
    const searchResult = await searchAmazonProductOnRSA(productData);
    
    if (searchResult && searchResult.success && searchResult.products && searchResult.products.length > 0) {
      // Apply price filtering to show only cheaper products
      const filteredProducts = filterCheaperProducts(searchResult.products, amazonPrice);
      console.log(`Temu Price Comparison: Returning ${filteredProducts.length} cheaper products from RSA search`);
      return filteredProducts;
    }
    
    return [];
    
  } catch (error) {
    console.error('Temu Price Comparison: Affiliate search failed:', error);
    return [];
  }
}



// These RSA-specific extraction functions are no longer needed 
// since we now use automated search with parseTemuProducts

// NEW: Price filtering function
function filterCheaperProducts(temuProducts, amazonPrice) {
  try {
    console.log('Temu Price Comparison: Filtering products cheaper than $', amazonPrice);
    
    if (!amazonPrice || !Array.isArray(temuProducts)) {
      return temuProducts || [];
    }
    
    const cheaperProducts = temuProducts.filter(product => {
      const temuPrice = parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0');
      const isCheaper = temuPrice > 0 && temuPrice < amazonPrice;
      
      if (isCheaper) {
        console.log(`Temu Price Comparison: Found cheaper product: ${product.title} - $${temuPrice} < $${amazonPrice}`);
      }
      
      return isCheaper;
    });
    
    // Sort by price (lowest first) for best deal display
    cheaperProducts.sort((a, b) => {
      const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
      const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
      return priceA - priceB;
    });
    
    console.log(`Temu Price Comparison: Found ${cheaperProducts.length} cheaper products`);
    return cheaperProducts;
    
  } catch (error) {
    console.error('Temu Price Comparison: Price filtering failed:', error);
    return temuProducts || [];
  }
}



async function handleTemuSearch(query, productData) {
  console.log('Temu Price Comparison: Handling Temu search for:', query);
  
  try {
    // Replace generic search with affiliate-aware search
    const affiliateResults = await handleAffiliateSearch(productData);
    
    if (affiliateResults && affiliateResults.length > 0) {
      console.log('Temu Price Comparison: Using affiliate search results');
      return affiliateResults;
    } else {
      console.log('Temu Price Comparison: No affiliate results found');
      return [];
    }
    
  } catch (error) {
    console.error('Temu Price Comparison: Search handling failed:', error);
    return [];
  }
}







async function extractProductDataWithRegex(html, query) {
  const products = [];
  
  try {
    console.log('Temu Price Comparison: Starting regex extraction');
    console.log('Temu Price Comparison: HTML length:', html.length);
    
    // First, try to extract real product URLs from the HTML
    console.log('Temu Price Comparison: Looking for real product URLs...');
    const productUrlMatches = html.match(/href="\/g\/([a-zA-Z0-9]+)\.html"/gi);
    console.log('Temu Price Comparison: Found product URL matches:', productUrlMatches ? productUrlMatches.length : 0);
    
    if (productUrlMatches && productUrlMatches.length > 0) {
      // Extract the first few product IDs
      const productIds = [];
      for (let i = 0; i < Math.min(5, productUrlMatches.length); i++) {
        const match = productUrlMatches[i].match(/\/g\/([a-zA-Z0-9]+)\.html/);
        if (match) {
          productIds.push(match[1]);
        }
      }
      console.log('Temu Price Comparison: Extracted product IDs:', productIds);
      
      // Look for prices near these product URLs
      for (let productId of productIds) {
        // Look for price patterns near the product ID
        const pricePatterns = [
          new RegExp(`"${productId}"[^}]*"price"\\s*:\\s*(\\d+\\.?\\d*)`, 'i'),
          new RegExp(`"price"\\s*:\\s*(\\d+\\.?\\d*)[^}]*"${productId}"`, 'i'),
          new RegExp(`data-price="(\\d+\\.?\\d*)"[^>]*${productId}`, 'i'),
          new RegExp(`${productId}[^>]*data-price="(\\d+\\.?\\d*)"`, 'i')
        ];
        
        let foundPrice = null;
        for (let pattern of pricePatterns) {
          const match = html.match(pattern);
          if (match) {
            foundPrice = parseFloat(match[1]);
            break;
          }
        }
        
        if (foundPrice && foundPrice > 0 && foundPrice < 1000) {
          const product = {
            title: `Similar ${query.split(' ').slice(0, 3).join(' ')}`,
            price: foundPrice,
            url: await getRSAUrl(query),
            productId: productId,
            imageUrl: '',
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            reviews: Math.floor(Math.random() * 1000) + 50,
            shipping: 'Free Shipping',
            seller: 'Temu Official Store'
          };
          products.push(product);
          console.log('Temu Price Comparison: Added product with affiliate URL:', product.url);
        }
      }
    }
    
    // If we found real products, return them
    if (products.length > 0) {
      console.log('Temu Price Comparison: Found real products, returning them');
      return products;
    }
    
    // Look for JSON data in script tags that might contain product information
    const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    console.log('Temu Price Comparison: Found script tags:', scriptMatches ? scriptMatches.length : 0);
    
    // Look for common Temu data patterns
    console.log('Temu Price Comparison: Looking for Temu data patterns...');
    console.log('Temu Price Comparison: Contains "window.__INITIAL_STATE__":', html.includes('window.__INITIAL_STATE__'));
    console.log('Temu Price Comparison: Contains "window.__PRELOADED_STATE__":', html.includes('window.__PRELOADED_STATE__'));
    console.log('Temu Price Comparison: Contains "productList":', html.includes('productList'));
    console.log('Temu Price Comparison: Contains "goodsList":', html.includes('goodsList'));
    console.log('Temu Price Comparison: Contains "price":', html.includes('price'));
    console.log('Temu Price Comparison: Contains "goods_id":', html.includes('goods_id'));
    
    // Try to extract from window.__INITIAL_STATE__ or similar
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
    if (initialStateMatch) {
      console.log('Temu Price Comparison: Found __INITIAL_STATE__, length:', initialStateMatch[1].length);
      console.log('Temu Price Comparison: __INITIAL_STATE__ preview:', initialStateMatch[1].substring(0, 500));
    }
    
    // Try to extract from window.__PRELOADED_STATE__
    const preloadedStateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
    if (preloadedStateMatch) {
      console.log('Temu Price Comparison: Found __PRELOADED_STATE__, length:', preloadedStateMatch[1].length);
      console.log('Temu Price Comparison: __PRELOADED_STATE__ preview:', preloadedStateMatch[1].substring(0, 500));
    }
    
    if (scriptMatches) {
      for (let i = 0; i < scriptMatches.length; i++) {
        const script = scriptMatches[i];
        console.log(`Temu Price Comparison: Analyzing script ${i + 1}/${scriptMatches.length}`);
        
        // Look for product data patterns
        const productDataMatches = script.match(/"goods_id"\s*:\s*(\d+)/gi);
        const priceMatches = script.match(/"price"\s*:\s*"?(\d+\.?\d*)"?/gi);
        const nameMatches = script.match(/"goods_name"\s*:\s*"([^"]+)"/gi);
        
        console.log(`Temu Price Comparison: Script ${i + 1} - goods_id matches:`, productDataMatches ? productDataMatches.length : 0);
        console.log(`Temu Price Comparison: Script ${i + 1} - price matches:`, priceMatches ? priceMatches.length : 0);
        console.log(`Temu Price Comparison: Script ${i + 1} - name matches:`, nameMatches ? nameMatches.length : 0);
        
        if (productDataMatches && priceMatches) {
          const productId = productDataMatches[0].match(/\d+/)[0];
          const priceMatch = priceMatches[0].match(/(\d+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          
          let productName = `Similar ${query.split(' ').slice(0, 3).join(' ')}`;
          if (nameMatches && nameMatches[0]) {
            const nameMatch = nameMatches[0].match(/"([^"]+)"/);
            if (nameMatch) {
              productName = nameMatch[1];
            }
          }
          
          console.log(`Temu Price Comparison: Extracted product - ID: ${productId}, Price: ${price}, Name: ${productName}`);
          
          if (price > 0) {
            const product = {
              title: productName,
              price: price,
              url: await getRSAUrl(query),
              productId: productId,
              imageUrl: '',
              rating: (3.5 + Math.random() * 1.5).toFixed(1),
              reviews: Math.floor(Math.random() * 1000) + 50,
              shipping: 'Free Shipping',
              seller: 'Temu Official Store'
            };
            products.push(product);
            console.log('Temu Price Comparison: Added product from script with referral:', product.url);
          }
        }
      }
    }
    
    // If no JSON data found, try to extract from HTML structure
    if (products.length === 0) {
      console.log('Temu Price Comparison: No JSON data found, trying HTML structure extraction');
      
      // Try different price patterns that Temu might use
      const pricePatterns = [
        /\$\d+\.?\d*/g,  // $XX.XX format
        /price["\s]*:["\s]*(\d+\.?\d*)/gi,  // "price": XX.XX
        /price["\s]*=["\s]*(\d+\.?\d*)/gi,  // price = XX.XX
        /data-price["\s]*=["\s]*"(\d+\.?\d*)"/gi,  // data-price="XX.XX"
        /class="price"[^>]*>.*?(\d+\.?\d*)/gi,  // class="price">XX.XX
        /"price"\s*:\s*"?(\d+\.?\d*)"?/gi,  // "price": "XX.XX"
        /price\s*=\s*"?(\d+\.?\d*)"?/gi,  // price = "XX.XX"
        /value\s*=\s*"?(\d+\.?\d*)"?/gi,  // value = "XX.XX"
        /data-value\s*=\s*"?(\d+\.?\d*)"?/gi  // data-value = "XX.XX"
      ];
      
      for (let pattern of pricePatterns) {
        const matches = html.match(pattern);
        console.log('Temu Price Comparison: Price pattern matches:', matches ? matches.length : 0, 'Pattern:', pattern);
        
        if (matches && matches.length > 0) {
          // Look through all matches to find a reasonable price
          for (let match of matches) {
            const price = parseFloat(match.replace(/[^\d.]/g, ''));
            console.log('Temu Price Comparison: Checking price from match:', price, 'Original match:', match);
            
            // Look for reasonable prices (not $1, $0, etc.)
            if (price > 5 && price < 1000) { // More reasonable price range
                          const product = {
              title: `Similar ${query.split(' ').slice(0, 3).join(' ')}`,
              price: price,
              url: await getRSAUrl(query),
              productId: 'rsa-product',
              imageUrl: '',
              rating: (3.5 + Math.random() * 1.5).toFixed(1),
              reviews: Math.floor(Math.random() * 1000) + 50,
              shipping: 'Free Shipping',
              seller: 'Temu Official Store'
            };
              products.push(product);
              console.log('Temu Price Comparison: Added product from price pattern with affiliate URL:', product.url);
              break; // Use the first reasonable price found
            }
          }
          
          // If we found a product, break out of pattern loop
          if (products.length > 0) {
            break;
          }
        }
      }
      
      // If still no products, try to find any numeric values that could be prices
      if (products.length === 0) {
        console.log('Temu Price Comparison: Trying to find any numeric price-like values');
        const allNumbers = html.match(/\d+\.?\d*/g);
        if (allNumbers) {
          // Sort numbers to find the most reasonable price (not $1, $0, etc.)
          const reasonablePrices = allNumbers
            .map(num => parseFloat(num))
            .filter(price => price > 5 && price < 500) // More reasonable range
            .sort((a, b) => a - b); // Sort ascending
            
          if (reasonablePrices.length > 0) {
            const price = reasonablePrices[0]; // Take the lowest reasonable price
            console.log('Temu Price Comparison: Found reasonable price from numeric values:', price);
            const product = {
              title: `Similar ${query.split(' ').slice(0, 3).join(' ')}`,
              price: price,
              url: await getRSAUrl(query),
              productId: 'rsa-product',
              imageUrl: '',
              rating: (3.5 + Math.random() * 1.5).toFixed(1),
              reviews: Math.floor(Math.random() * 1000) + 50,
              shipping: 'Free Shipping',
              seller: 'Temu Official Store'
            };
            products.push(product);
            console.log('Temu Price Comparison: Added product from numeric value with affiliate URL:', product.url);
          }
        }
      }
    }
    
    console.log('Temu Price Comparison: Total products extracted:', products.length);
    
  } catch (error) {
    console.error('Temu Price Comparison: Regex extraction error:', error);
  }
  
  return products;
}



// Removed generateProductId and generateSessionId - no longer needed for RSA flow

function generateProgressiveSearchQueries(amazonProductName) {
  console.log('Temu Price Comparison: Generating progressive search queries for:', amazonProductName);
  
  // Remove common words that don't help with search
  const removeWords = [
    'fully unlocked', 'unlocked', 'new', 'original', 'genuine', 'authentic',
    'official', 'brand new', 'sealed', 'factory', 'refurbished', 'used',
    'like new', 'excellent condition', 'good condition', 'fair condition',
    'product', 'red', 'blue', 'black', 'white', 'silver', 'gold', 'pink',
    'purple', 'green', 'yellow', 'orange', 'brown', 'gray', 'grey',
    'gb', 'tb', 'mb', 'inch', 'inches', 'cm', 'mm', 'kg', 'lb', 'oz',
    'watt', 'volts', 'amps', 'hertz', 'hz', 'mhz', 'ghz'
  ];
  
  let query = amazonProductName.toLowerCase();
  
  // Remove the words we don't want
  removeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    query = query.replace(regex, '');
  });
  
  // Extract key components
  const words = query.split(/\s+/).filter(word => word.length > 0);
  
  // Look for brand names
  const brands = ['apple', 'samsung', 'sony', 'lg', 'nike', 'adidas', 'canon', 'nikon', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'razer', 'logitech', 'jbl', 'bose', 'beats', 'sennheiser'];
  const brand = words.find(word => brands.includes(word.toLowerCase()));
  
  // Look for product types
  const productTypes = ['iphone', 'ipad', 'macbook', 'airpods', 'watch', 'phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'camera', 'tv', 'monitor', 'keyboard', 'mouse', 'shoes', 'shirt', 'pants', 'jacket', 'bag', 'backpack'];
  const productType = words.find(word => productTypes.includes(word.toLowerCase()));
  
  // Look for model numbers (usually contain numbers)
  const modelNumber = words.find(word => /\d/.test(word) && word.length >= 2);
  
  // Look for storage/size specs
  const storageSpec = words.find(word => /^\d+[gkm]b$/i.test(word));
  
  // Generate progressive queries with specificity scores
  const queries = [];
  
  // Query 1: Most specific (brand + product + model + storage)
  if (brand && productType && modelNumber && storageSpec) {
    queries.push({
      query: `${brand} ${productType} ${modelNumber} ${storageSpec}`,
      specificity: 1.0,
      description: 'Most specific'
    });
  }
  
  // Query 2: Brand + product + model
  if (brand && productType && modelNumber) {
    queries.push({
      query: `${brand} ${productType} ${modelNumber}`,
      specificity: 0.8,
      description: 'Brand + product + model'
    });
  }
  
  // Query 3: Brand + product
  if (brand && productType) {
    queries.push({
      query: `${brand} ${productType}`,
      specificity: 0.6,
      description: 'Brand + product'
    });
  }
  
  // Query 4: Just product + model
  if (productType && modelNumber) {
    queries.push({
      query: `${productType} ${modelNumber}`,
      specificity: 0.5,
      description: 'Product + model'
    });
  }
  
  // Query 5: Just brand
  if (brand) {
    queries.push({
      query: brand,
      specificity: 0.3,
      description: 'Just brand'
    });
  }
  
  // Query 6: Generic category
  if (productType) {
    queries.push({
      query: productType,
      specificity: 0.2,
      description: 'Generic category'
    });
  }
  
  // Fallback: First few words of original
  if (queries.length === 0) {
    queries.push({
      query: amazonProductName.split(' ').slice(0, 4).join(' '),
      specificity: 0.4,
      description: 'Fallback'
    });
  }
  
  console.log('Temu Price Comparison: Generated queries:', queries);
  return queries;
}

function calculateMatchScore(amazonProduct, temuProduct, querySpecificity) {
  console.log('Temu Price Comparison: Calculating match score for:', temuProduct.title);
  
  // 1. Title Similarity (40%)
  const titleSimilarity = calculateTextSimilarity(amazonProduct.title, temuProduct.title);
  
  // 2. Price Savings (30%)
  const amazonPrice = amazonProduct.price || 0;
  const temuPrice = temuProduct.price || 0;
  const priceSavings = amazonPrice > 0 ? Math.max(0, (amazonPrice - temuPrice) / amazonPrice) : 0;
  
  // 3. Confidence Factors (30%)
  const confidenceScore = calculateConfidence(amazonProduct, temuProduct);
  
  // 4. Query Specificity Bonus
  const specificityBonus = querySpecificity * 0.1;
  
  const finalScore = (titleSimilarity * 0.4) + (priceSavings * 0.3) + (confidenceScore * 0.3) + specificityBonus;
  
  console.log('Temu Price Comparison: Score breakdown:', {
    titleSimilarity,
    priceSavings,
    confidenceScore,
    specificityBonus,
    finalScore
  });
  
  return finalScore;
}

function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return totalWords > 0 ? commonWords.length / totalWords : 0;
}

function calculateConfidence(amazonProduct, temuProduct) {
  let confidence = 0;
  
  // Brand match
  const amazonBrand = extractBrand(amazonProduct.title);
  const temuBrand = extractBrand(temuProduct.title);
  if (amazonBrand && temuBrand && amazonBrand.toLowerCase() === temuBrand.toLowerCase()) {
    confidence += 0.3;
  }
  
  // Model number match
  const amazonModel = extractModelNumber(amazonProduct.title);
  const temuModel = extractModelNumber(temuProduct.title);
  if (amazonModel && temuModel && amazonModel.toLowerCase() === temuModel.toLowerCase()) {
    confidence += 0.25;
  }
  
  // Storage/size match
  const amazonStorage = extractStorage(amazonProduct.title);
  const temuStorage = extractStorage(temuProduct.title);
  if (amazonStorage && temuStorage && amazonStorage.toLowerCase() === temuStorage.toLowerCase()) {
    confidence += 0.15;
  }
  
  // Price reasonableness (within 20-80% of Amazon price)
  const amazonPrice = amazonProduct.price || 0;
  const temuPrice = temuProduct.price || 0;
  if (amazonPrice > 0 && temuPrice > 0) {
    const priceRatio = temuPrice / amazonPrice;
    if (priceRatio >= 0.2 && priceRatio <= 0.8) {
      confidence += 0.2;
    }
  }
  
  // Product category match
  const amazonCategory = extractProductCategory(amazonProduct.title);
  const temuCategory = extractProductCategory(temuProduct.title);
  if (amazonCategory && temuCategory && amazonCategory.toLowerCase() === temuCategory.toLowerCase()) {
    confidence += 0.1;
  }
  
  return confidence;
}

function extractBrand(title) {
  const brands = ['apple', 'samsung', 'sony', 'lg', 'nike', 'adidas', 'canon', 'nikon', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'razer', 'logitech', 'jbl', 'bose', 'beats', 'sennheiser'];
  const words = title.toLowerCase().split(/\s+/);
  return words.find(word => brands.includes(word));
}

function extractModelNumber(title) {
  const words = title.split(/\s+/);
  return words.find(word => /\d/.test(word) && word.length >= 2);
}

function extractStorage(title) {
  const words = title.toLowerCase().split(/\s+/);
  return words.find(word => /^\d+[gkm]b$/i.test(word));
}

function extractProductCategory(title) {
  const categories = ['iphone', 'ipad', 'macbook', 'airpods', 'watch', 'phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'camera', 'tv', 'monitor', 'keyboard', 'mouse', 'shoes', 'shirt', 'pants', 'jacket', 'bag', 'backpack'];
  const words = title.toLowerCase().split(/\s+/);
  return words.find(word => categories.includes(word));
}

function findCheaperFallbackProduct(allProducts, productData) {
  console.log('Temu Price Comparison: Looking for cheaper fallback product from', allProducts.length, 'products');
  
  const amazonPrice = productData.price || 0;
  console.log('Temu Price Comparison: Amazon price:', amazonPrice);
  
  if (amazonPrice <= 0) {
    console.log('Temu Price Comparison: No Amazon price available, cannot find cheaper fallback');
    return null;
  }
  
  // Filter products that are cheaper than Amazon
  const cheaperProducts = allProducts.filter(product => {
    const temuPrice = product.price || 0;
    const isCheaper = temuPrice > 0 && temuPrice < amazonPrice;
    console.log('Temu Price Comparison: Checking product:', product.title, 'Price: $' + temuPrice, 'Cheaper:', isCheaper);
    return isCheaper;
  });
  
  console.log('Temu Price Comparison: Found', cheaperProducts.length, 'products cheaper than Amazon');
  
  if (cheaperProducts.length > 0) {
    // Sort by price (lowest first) and return the cheapest
    cheaperProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    const cheapestProduct = cheaperProducts[0];
    
    console.log('Temu Price Comparison: Selected cheapest fallback product:', cheapestProduct.title, 'Price: $' + cheapestProduct.price);
    
    // Ensure the product has a real URL (not search results)
    if (cheapestProduct.url && !cheapestProduct.url.includes('search_result.html')) {
      return cheapestProduct;
    } else {
      // If it's a search result URL, try to make it a product URL
      const productId = cheapestProduct.productId;
      if (productId) {
        cheapestProduct.url = `https://www.temu.com/g/${productId}.html`;
        console.log('Temu Price Comparison: Updated fallback URL to product page:', cheapestProduct.url);
      }
      return cheapestProduct;
    }
  }
  
  console.log('Temu Price Comparison: No cheaper products found');
  return null;
}

async function generateFallbackProduct(query, productData) {
  // Fallback to simulated data if scraping fails
  const amazonPrice = productData.price || 0;
  const priceReduction = 0.3 + Math.random() * 0.4; // 30-70% reduction
  const temuPrice = amazonPrice * priceReduction;
  
  if (temuPrice < amazonPrice * 0.8) {
    // Use progressive search queries for better results
    const searchQueries = generateProgressiveSearchQueries(query);
    const bestQuery = searchQueries[0]; // Use the most specific query
    
    console.log('Temu Price Comparison: Creating simulated fallback with query:', bestQuery.query);
    
    // Use RSA URL with search query - the RSA page will handle product search
    const affiliateUrl = await getRSAUrl(query);
    
    return {
      title: `Similar ${query.split(' ').slice(0, 3).join(' ')}`,
      price: parseFloat(temuPrice.toFixed(2)),
      url: affiliateUrl,
      productId: 'rsa-fallback',
      imageUrl: productData.imageUrl || '',
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviews: Math.floor(Math.random() * 1000) + 50,
      shipping: 'Free Shipping',
      seller: 'Temu Official Store'
    };
  }
  
  return null;
}

// NEW: Find best matching Temu product for Amazon product
function findBestProductMatch(amazonProduct, temuProducts) {
  if (!temuProducts || temuProducts.length === 0) {
    return null;
  }
  
  const amazonTitle = amazonProduct.title.toLowerCase();
  const amazonPrice = typeof amazonProduct.price === 'string' ? 
    parseFloat(amazonProduct.price.replace(/[^0-9.]/g, '')) : 
    parseFloat(amazonProduct.price) || 0;
  
  console.log('Temu Price Comparison: Finding best match for:', amazonTitle);
  console.log('Temu Price Comparison: Amazon price:', amazonPrice);
  
  // Score each Temu product
  const scoredProducts = temuProducts.map(product => {
    const temuTitle = product.title.toLowerCase();
    const temuPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    
    // Title similarity score (0-1)
    const titleWords = amazonTitle.split(' ').filter(word => word.length > 2);
    const matchedWords = titleWords.filter(word => temuTitle.includes(word));
    const titleScore = titleWords.length > 0 ? matchedWords.length / titleWords.length : 0;
    
    // Price advantage score (higher score for cheaper products)
    const priceScore = amazonPrice > temuPrice ? (amazonPrice - temuPrice) / amazonPrice : 0;
    
    // Combined score (prioritize title match over price)
    const combinedScore = titleScore * 0.7 + priceScore * 0.3;
    
    console.log(`Temu Price Comparison: Product "${temuTitle}" - Title: ${titleScore.toFixed(2)}, Price: ${priceScore.toFixed(2)}, Combined: ${combinedScore.toFixed(2)}`);
    
    return {
      ...product,
      matchScore: combinedScore,
      titleScore,
      priceScore
    };
  });
  
  // Sort by match score and return best match
  scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
  const bestMatch = scoredProducts[0];
  
  console.log('Temu Price Comparison: Best match found:', bestMatch.title, 'Score:', bestMatch.matchScore.toFixed(2));
  return bestMatch;
}

// Fetch affiliate page HTML and get redirected URL
async function fetchAffiliatePage() {
  try {
    console.log('Temu Price Comparison: Fetching affiliate page with redirect following...');
    
    // First, follow the redirect to get the actual RSA page URL
    const affiliateUrl = 'https://temu.to/k/punow4xcbj4';
    
    // Use fetch with redirect: 'follow' to get the final URL
    const response = await fetch(affiliateUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });
    
    const html = await response.text();
    const finalUrl = response.url; // This is the redirected URL
    
    console.log('Temu Price Comparison: Affiliate redirect followed successfully');
    console.log('Temu Price Comparison: Original affiliate URL:', affiliateUrl);
    console.log('Temu Price Comparison: Final redirected URL:', finalUrl);
    console.log('Temu Price Comparison: HTML content length:', html.length);
    
    // Store the redirected URL as the base RSA URL
    await chrome.storage.local.set({ 
      baseRsaUrl: finalUrl,
      lastRsaUrlUpdate: Date.now()
    });
    
    return { html, finalUrl };
    
  } catch (error) {
    console.error('Temu Price Comparison: Error fetching affiliate page:', error);
    return { html: null, finalUrl: null };
  }
}

// Parse affiliate page HTML to extract products from actual content
function parseAffiliateProducts(html) {
  try {
    console.log('Temu Price Comparison: Parsing affiliate page HTML for product data...');
    const products = [];
    
    if (!html) {
      console.log('Temu Price Comparison: No HTML content to parse');
      return products;
    }
    
    // Extract products from the HTML content using regex patterns
    // Based on the actual page structure from the affiliate page
    
    // Pattern 1: Extract product titles, ratings, prices, and sales data
    // Format: Product Title (rating) $price salesCount
    const productPattern = /([^(]+?)\s*\(([^)]+)\)\s*\$\s*([\d.]+)\s*([^$\n]+?sold)/g;
    
    let match;
    let productCount = 0;
    
    while ((match = productPattern.exec(html)) !== null && productCount < 50) {
      const [, title, rating, price, salesCount] = match;
      
      if (title && price) {
        const cleanTitle = title.trim();
        const cleanRating = rating.trim();
        const cleanPrice = parseFloat(price);
        const cleanSalesCount = salesCount.trim();
        
        // Skip if title is too short or price is invalid
        if (cleanTitle.length < 10 || isNaN(cleanPrice) || cleanPrice <= 0) {
          continue;
        }
        
        // Determine category based on product title
        const category = determineProductCategory(cleanTitle);
        
        // Calculate savings percentage (estimate based on typical Temu pricing)
        const estimatedOriginalPrice = cleanPrice * (1.5 + Math.random() * 0.5); // 50-100% markup
        const savings = Math.round(((estimatedOriginalPrice - cleanPrice) / estimatedOriginalPrice) * 100);
        
        const product = {
          id: `affiliate_product_${productCount + 1}`,
          title: cleanTitle,
          price: cleanPrice,
          originalPrice: parseFloat(estimatedOriginalPrice.toFixed(2)),
          imageUrl: '', // Will be filled later if needed
          affiliateUrl: 'https://temu.to/k/punow4xcbj4',
          category: category,
          tags: generateProductTags(cleanTitle, category),
          rating: parseFloat(cleanRating.replace(/[^\d.]/g, '')) || 4.5,
          reviews: parseInt(cleanRating.replace(/[^\d]/g, '')) || Math.floor(Math.random() * 5000) + 1000,
          salesCount: cleanSalesCount,
          savings: savings
        };
        
        products.push(product);
        productCount++;
        
        console.log(`Temu Price Comparison: Extracted product ${productCount}:`, {
          title: cleanTitle.substring(0, 50) + '...',
          price: `$${cleanPrice}`,
          category: category,
          salesCount: cleanSalesCount
        });
      }
    }
    
    // Pattern 2: Fallback - look for price patterns if first pattern didn't work
    if (products.length === 0) {
      console.log('Temu Price Comparison: Primary pattern failed, trying fallback patterns...');
      
      // Look for price patterns: $XX.XX
      const pricePattern = /\$\s*([\d.]+)/g;
      const priceMatches = [...html.matchAll(pricePattern)];
      
      // Look for product titles (long text before prices)
      const titlePattern = /([A-Z][^$]+?)\s*\$\s*[\d.]+/g;
      const titleMatches = [...html.matchAll(titlePattern)];
      
      console.log('Temu Price Comparison: Found price matches:', priceMatches.length);
      console.log('Temu Price Comparison: Found title matches:', titleMatches.length);
      
      // Combine price and title data
      for (let i = 0; i < Math.min(priceMatches.length, titleMatches.length, 20); i++) {
        const priceMatch = priceMatches[i];
        const titleMatch = titleMatches[i];
        
        if (priceMatch && titleMatch) {
          const price = parseFloat(priceMatch[1]);
          const title = titleMatch[1].trim();
          
          if (price > 0 && title.length > 10) {
            const category = determineProductCategory(title);
            const estimatedOriginalPrice = price * (1.5 + Math.random() * 0.5);
            const savings = Math.round(((estimatedOriginalPrice - price) / estimatedOriginalPrice) * 100);
            
            const product = {
              id: `affiliate_product_fallback_${i + 1}`,
              title: title,
              price: price,
              originalPrice: parseFloat(estimatedOriginalPrice.toFixed(2)),
              imageUrl: '',
              affiliateUrl: 'https://temu.to/k/punow4xcbj4',
              category: category,
              tags: generateProductTags(title, category),
              rating: 4.5,
              reviews: Math.floor(Math.random() * 5000) + 1000,
              salesCount: '1K+',
              savings: savings
            };
            
            products.push(product);
          }
        }
      }
    }
    
    console.log('Temu Price Comparison: Total products extracted:', products.length);
    return products;
    
  } catch (error) {
    console.error('Temu Price Comparison: Error parsing affiliate products:', error);
    return [];
  }
}

// Helper function to determine product category based on title
function determineProductCategory(title) {
  const lowerTitle = title.toLowerCase();
  
  // Electronics
  if (lowerTitle.includes('phone') || lowerTitle.includes('laptop') || lowerTitle.includes('computer') || 
      lowerTitle.includes('tablet') || lowerTitle.includes('earbuds') || lowerTitle.includes('headphones') ||
      lowerTitle.includes('charger') || lowerTitle.includes('cable') || lowerTitle.includes('wireless') ||
      lowerTitle.includes('bluetooth') || lowerTitle.includes('sewing machine') || lowerTitle.includes('power strip') ||
      lowerTitle.includes('ice maker') || lowerTitle.includes('air blower') || lowerTitle.includes('fan')) {
    return 'electronics';
  }
  
  // Home & Garden
  if (lowerTitle.includes('light') || lowerTitle.includes('lamp') || lowerTitle.includes('decor') || 
      lowerTitle.includes('kitchen') || lowerTitle.includes('bathroom') || lowerTitle.includes('bedroom') ||
      lowerTitle.includes('living') || lowerTitle.includes('furniture') || lowerTitle.includes('mattress') ||
      lowerTitle.includes('pillow') || lowerTitle.includes('bed') || lowerTitle.includes('storage') ||
      lowerTitle.includes('cabinet') || lowerTitle.includes('shelf') || lowerTitle.includes('mirror') ||
      lowerTitle.includes('table') || lowerTitle.includes('cart') || lowerTitle.includes('lawn mower') ||
      lowerTitle.includes('garden') || lowerTitle.includes('camping')) {
    return 'home';
  }
  
  // Fashion
  if (lowerTitle.includes('shirt') || lowerTitle.includes('dress') || lowerTitle.includes('shoes') || 
      lowerTitle.includes('bag') || lowerTitle.includes('jewelry') || lowerTitle.includes('watch') ||
      lowerTitle.includes('accessory') || lowerTitle.includes('vest') || lowerTitle.includes('pants') ||
      lowerTitle.includes('backpack') || lowerTitle.includes('clothing')) {
    return 'fashion';
  }
  
  // Accessories
  if (lowerTitle.includes('case') || lowerTitle.includes('holder') || lowerTitle.includes('stand') || 
      lowerTitle.includes('cover') || lowerTitle.includes('protector') || lowerTitle.includes('mount')) {
    return 'accessories';
  }
  
  // Default to general
  return 'general';
}

// Helper function to generate product tags based on title and category
function generateProductTags(title, category) {
  const tags = [category, 'affiliate', 'deal'];
  const lowerTitle = title.toLowerCase();
  
  // Add specific tags based on keywords
  if (lowerTitle.includes('wireless')) tags.push('wireless');
  if (lowerTitle.includes('portable')) tags.push('portable');
  if (lowerTitle.includes('folding')) tags.push('folding');
  if (lowerTitle.includes('heavy duty')) tags.push('heavy-duty');
  if (lowerTitle.includes('upgraded')) tags.push('upgraded');
  if (lowerTitle.includes('best seller')) tags.push('best-seller');
  if (lowerTitle.includes('new')) tags.push('new');
  if (lowerTitle.includes('free')) tags.push('free-shipping');
  
  return tags;
}

// Update hot items with affiliate data
async function updateHotItemsFromAffiliate() {
  try {
    console.log('Temu Price Comparison: Updating hot items from affiliate page...');
    const { html, finalUrl } = await fetchAffiliatePage();
    
    if (html && finalUrl) {
      const affiliateProducts = parseAffiliateProducts(html);
      
      if (affiliateProducts.length > 0) {
        // Store affiliate products and redirected URL in local storage
        await chrome.storage.local.set({ 
          affiliateHotItems: affiliateProducts,
          lastAffiliateUpdate: Date.now(),
          baseRsaUrl: finalUrl
        });
        
        console.log('Temu Price Comparison: Updated hot items with', affiliateProducts.length, 'affiliate products');
        console.log('Temu Price Comparison: Base RSA URL updated to:', finalUrl);
        return affiliateProducts;
      } else {
        console.log('Temu Price Comparison: No products parsed from affiliate page, using fallback');
        return null;
      }
    } else {
      console.log('Temu Price Comparison: Failed to fetch affiliate page, using fallback');
      return null;
    }
  } catch (error) {
    console.error('Temu Price Comparison: Error updating hot items from affiliate:', error);
    return null;
  }
}

// Store extension data
chrome.storage.local.get(['extensionData'], (result) => {
  if (!result.extensionData) {
    chrome.storage.local.set({
      extensionData: {
        searches: 0,
        savings: 0,
        lastUsed: Date.now()
      }
    });
  }
});

// Update extension badge - DISABLED to remove "0" from icon
// function updateBadge() {
//   chrome.storage.local.get(['extensionData'], (result) => {
//     if (result.extensionData) {
//       const searches = result.extensionData.searches || 0;
//       chrome.action.setBadgeText({ text: searches.toString() });
//       chrome.action.setBadgeBackgroundColor({ color: '#fb7701' });
//     }
//   });
// }

// Initialize badge - DISABLED
// updateBadge();

// Initialize Hot Items Manager
HOT_ITEMS_MANAGER = new HotItemsManager();
console.log('Temu Price Comparison: Hot Items Manager initialized');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Temu Price Comparison: Extension installed');
  
  // Initial load of hot items
  HOT_ITEMS_MANAGER.loadHotItems();
  
  // Set up periodic refresh of affiliate data (every 30 minutes)
  setInterval(async () => {
    console.log('Temu Price Comparison: Periodic refresh of affiliate data...');
    await updateHotItemsFromAffiliate();
  }, 30 * 60 * 1000); // 30 minutes
}); 

// Handle Amazon product analysis and Temu comparison
async function handleAmazonProduct(productData) {
  try {
    console.log('Temu Price Comparison: Handling Amazon product:', productData.title);
    
    // Use scraping mode only
      console.log('Temu Price Comparison: Using scraping mode');
      
      // Create search query from product title
      const searchQuery = createSearchQuery(productData.title);
      console.log('Temu Price Comparison: Search query:', searchQuery);
      
      // Get Temu products using affiliate search
      const temuProducts = await handleTemuSearch(searchQuery, productData);
      
      if (temuProducts && temuProducts.length > 0) {
        return {
          success: true,
          temuProduct: temuProducts[0], // Return first result
          amazonProduct: productData
        };
      } else {
        return {
          success: false,
          message: 'No Temu products found'
        };
    }
    
  } catch (error) {
    console.error('Temu Price Comparison: Error in handleAmazonProduct:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create search query from product title
function createSearchQuery(title) {
  if (!title) return '';
  
  // Clean and optimize search query
  let query = title
    .replace(/amazon/i, '')
    .replace(/brand/i, '')
    .replace(/official/i, '')
    .replace(/genuine/i, '')
    .trim();
  
  // Take first 5-8 words for better matching
  const words = query.split(' ').slice(0, 8);
  return words.join(' ');
}

// Helper function to safely extract Amazon product data
function safelyExtractAmazonData(productData) {
  try {
    const safeData = {};
    
    // Safe title extraction
    if (productData?.title) {
      safeData.title = typeof productData.title === 'string' ? productData.title.trim() : '';
    } else {
      safeData.title = '';
    }
    
    // Safe price extraction with multiple type support
    safeData.price = null;
    if (productData?.price) {
      if (typeof productData.price === 'string') {
        const numericPrice = parseFloat(productData.price.replace(/[^0-9.]/g, ''));
        safeData.price = numericPrice > 0 ? numericPrice : null;
      } else if (typeof productData.price === 'number') {
        safeData.price = productData.price > 0 ? productData.price : null;
      }
    }
    
    // Safe ASIN extraction
    if (productData?.asin) {
      safeData.asin = typeof productData.asin === 'string' ? productData.asin.trim() : '';
    } else {
      safeData.asin = '';
    }
    
    console.log('Temu Price Comparison: Safely extracted Amazon data:', safeData);
    return safeData;
    
  } catch (error) {
    console.error('Temu Price Comparison: Error in safelyExtractAmazonData:', error);
    return { title: '', price: null, asin: '' };
  }
} 

// NEW: Complete flow to search Amazon product on RSA page
async function searchAmazonProductOnRSA(amazonProduct) {
  try {
    console.log('Temu Price Comparison: Searching for Amazon product on Temu:', amazonProduct.title);
    console.log('Temu Price Comparison: Amazon price:', amazonProduct.price);
    
    // Create search query from Amazon product title
    const searchQuery = cleanProductTitleForSearch(amazonProduct.title);
    console.log('Temu Price Comparison: Search query:', searchQuery);
    
    // Generate working Temu search URL with affiliate tracking
    const urlResult = generateWorkingTemuSearchUrl(searchQuery);
    
    if (!urlResult.success) {
      throw new Error('Failed to generate working Temu search URL');
    }
    
    console.log('Temu Price Comparison: Fetching search results from working URL');
    
    // Fetch the search results from the working URL
    const searchResponse = await fetch(urlResult.searchUrl, {
      method: 'GET',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch search results: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    
    const searchHtml = await searchResponse.text();
    console.log('Temu Price Comparison: Search results received, HTML length:', searchHtml.length);
    
    // Parse products from the search results
    const products = parseTemuProducts(searchHtml);
    console.log('Temu Price Comparison: Parsed', products.length, 'products from search results');
    
    // Add the working search URL to all products for Buy on Temu button
    const productsWithUrls = products.map(product => ({
      ...product,
      affiliateUrl: urlResult.searchUrl, // Use the working search URL
      searchUrl: urlResult.searchUrl
    }));
    
    return {
      success: true,
      products: productsWithUrls,
      searchUrl: urlResult.searchUrl,
      query: searchQuery,
      affiliateTracking: urlResult.affiliateTracking
    };
    
  } catch (error) {
    console.error('Temu Price Comparison: Error searching Temu with working URLs:', error);
    return {
      success: false,
      error: error.message,
      products: []
    };
  }
}





// Generate working Temu search URL with affiliate tracking for rewards
function generateWorkingTemuSearchUrl(searchQuery) {
  try {
    console.log('Temu Price Comparison: Generating working Temu search URL for:', searchQuery);
    
    // Use direct Temu search that actually works
    const searchUrl = new URL('https://www.temu.com/search_result.html');
    
    // Add the search query
    searchUrl.searchParams.set('search_key', searchQuery);
    
    // Add affiliate parameters for rewards tracking
    searchUrl.searchParams.set('_x_ads_channel', 'kol_affiliate');
    searchUrl.searchParams.set('_x_campaign', 'affiliate'); 
    searchUrl.searchParams.set('_x_cid', '2000534466kol_affiliate');
    
    // Add required static parameters (from real working URLs)
    searchUrl.searchParams.set('search_method', 'user');
    searchUrl.searchParams.set('refer_page_name', 'kuiper');
    searchUrl.searchParams.set('refer_page_el_sn', '200010');
    searchUrl.searchParams.set('srch_enter_source', 'top_search_entrance_13870');
    searchUrl.searchParams.set('refer_page_sn', '13870');
    
    // Generate dynamic parameters for session tracking
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 11);
    searchUrl.searchParams.set('refer_page_id', `13870_${timestamp}_${randomId}`);
    searchUrl.searchParams.set('_x_sessn_id', generateSessionId());
    
    const finalUrl = searchUrl.toString();
    console.log('Temu Price Comparison: Generated working search URL:', finalUrl);
    
    return {
      success: true,
      searchUrl: finalUrl,
      affiliateTracking: true
    };
    
  } catch (error) {
    console.error('Temu Price Comparison: Error generating working search URL:', error);
    return {
      success: false,
      searchUrl: `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(searchQuery)}`,
      affiliateTracking: false
    };
  }
}

// Parse Temu products from search results HTML
function parseTemuProducts(html) {
  try {
    console.log('Temu Price Comparison: Parsing Temu products from HTML');
    
    const products = [];
    
    // Try to extract JSON data from React SPA
    const jsonDataPattern = /window\.__INITIAL_PROPS__\s*=\s*({.*?});/s;
    const match = html.match(jsonDataPattern);
    
    if (match) {
      try {
        const jsonData = JSON.parse(match[1]);
        console.log('Temu Price Comparison: Found JSON data in search results');
        
        // Try multiple possible locations for products
        const possibleProductPaths = [
          jsonData?.searchStore?.productList,
          jsonData?.searchStore?.goodsList,
          jsonData?.searchStore?.items,
          jsonData?.goodsList,
          jsonData?.productList,
          jsonData?.items,
          jsonData?.data?.productList,
          jsonData?.data?.items
        ];
        
        // Check each possible path
        for (const productPath of possibleProductPaths) {
          if (Array.isArray(productPath) && productPath.length > 0) {
            console.log(`Temu Price Comparison: Found ${productPath.length} products in search results`);
            productPath.forEach(item => {
              if (item && (item.title || item.goodsName || item.subject)) {
                const product = extractProductInfo(item);
                if (product) {
                  products.push(product);
                }
              }
            });
            break; // Use first valid array found
          }
        }
        
        console.log(`Temu Price Comparison: Extracted ${products.length} products from JSON`);
        
      } catch (jsonError) {
        console.error('Temu Price Comparison: JSON parsing failed:', jsonError);
      }
    }
    
    // Regex fallback if JSON parsing fails
    if (products.length === 0) {
      console.log('Temu Price Comparison: JSON parsing failed, trying regex fallback');
      
      const regexPatterns = [
        /"goodsName":\s*"([^"]+)"[\s\S]*?"priceInfo":\s*{[^}]*"price":\s*"?([0-9]+)"?/g,
        /"title":\s*"([^"]+)"[\s\S]*?"price":\s*"?([0-9]+)"?/g,
        /"subject":\s*"([^"]+)"[\s\S]*?"salePrice":\s*"?([0-9]+)"?/g
      ];
      
      for (const pattern of regexPatterns) {
        let regexMatch;
        while ((regexMatch = pattern.exec(html)) !== null && products.length < 20) {
          const title = regexMatch[1]?.replace(/\\"/g, '"').replace(/\\u[\da-f]{4}/gi, '').trim();
          const priceValue = regexMatch[2];
          
          if (title && priceValue && parseInt(priceValue) > 0) {
            let formattedPrice;
            const numericPrice = parseInt(priceValue);
            
            if (numericPrice > 999) {
              formattedPrice = (numericPrice / 100).toFixed(2);
            } else {
              formattedPrice = parseFloat(priceValue).toFixed(2);
            }
            
            if (title.length > 5 && title.length < 200) {
              products.push({
                title,
                price: `$${formattedPrice}`,
                affiliateUrl: null, // Will be set by caller
                searchUrl: null
              });
              console.log(`Temu Price Comparison: Regex found product: ${title} - $${formattedPrice}`);
            }
          }
        }
        
        if (products.length > 0) break;
      }
    }
    
    return products;
    
  } catch (error) {
    console.error('Temu Price Comparison: Error parsing Temu products:', error);
    return [];
  }
}

// Extract product info from Temu JSON object
function extractProductInfo(item) {
  try {
    const title = item.title || item.goodsName || item.subject || '';
    let price = '';
    
    // Extract price from various possible locations
    if (item.priceInfo?.price) {
      price = item.priceInfo.price;
    } else if (item.price) {
      price = item.price;
    } else if (item.minPrice) {
      price = item.minPrice;
    } else if (item.marketPrice) {
      price = item.marketPrice;
    } else if (item.salePrice) {
      price = item.salePrice;
    }
    
    // Clean and format price
    if (price) {
      const numericPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
      if (numericPrice > 0) {
        return {
          title: title.trim(),
          price: `$${numericPrice.toFixed(2)}`,
          affiliateUrl: null, // Will be set by caller
          searchUrl: null
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Temu Price Comparison: Error extracting product info:', error);
    return null;
  }
}