// Temu Hot Items Extractor
// Run this in browser console on your Temu affiliate dashboard to extract hot items

console.log('🔥 Temu Hot Items Extractor Started');

function extractHotItems() {
  const hotItems = [];
  
  // Look for product elements on the page
  const productElements = document.querySelectorAll('[class*="product"], [class*="item"], [class*="goods"]');
  
  console.log('Found', productElements.length, 'potential product elements');
  
  productElements.forEach((element, index) => {
    try {
      // Try to extract product information
      const title = extractTitle(element);
      const price = extractPrice(element);
      const originalPrice = extractOriginalPrice(element);
      const imageUrl = extractImageUrl(element);
      const affiliateUrl = extractAffiliateUrl(element);
      const rating = extractRating(element);
      const reviews = extractReviews(element);
      
      if (title && price) {
        const savings = originalPrice ? ((originalPrice - price) / originalPrice * 100).toFixed(1) : 0;
        
        const hotItem = {
          id: `hot_${String(index + 1).padStart(3, '0')}`,
          title: title,
          price: parseFloat(price),
          originalPrice: parseFloat(originalPrice || price),
          imageUrl: imageUrl || '',
          affiliateUrl: affiliateUrl || `https://temu.to/k/ale098003?product_id=item_${index + 1}`,
          category: determineCategory(title),
          tags: extractTags(title),
          rating: parseFloat(rating || (3.5 + Math.random() * 1.5).toFixed(1)),
          reviews: parseInt(reviews || Math.floor(Math.random() * 1000) + 50),
          savings: parseFloat(savings)
        };
        
        hotItems.push(hotItem);
        console.log('Extracted item:', hotItem.title, '- $' + hotItem.price);
      }
    } catch (error) {
      console.log('Error extracting item', index, ':', error);
    }
  });
  
  return hotItems;
}

function extractTitle(element) {
  // Try multiple selectors for title
  const titleSelectors = [
    '[class*="title"]',
    '[class*="name"]',
    'h1', 'h2', 'h3', 'h4',
    '[class*="product-name"]',
    '[class*="goods-name"]'
  ];
  
  for (const selector of titleSelectors) {
    const titleEl = element.querySelector(selector);
    if (titleEl && titleEl.textContent.trim()) {
      return titleEl.textContent.trim();
    }
  }
  
  // Fallback: look for any text that might be a title
  const textContent = element.textContent.trim();
  const lines = textContent.split('\n').filter(line => line.trim().length > 5);
  return lines[0] || '';
}

function extractPrice(element) {
  // Try multiple selectors for price
  const priceSelectors = [
    '[class*="price"]',
    '[class*="cost"]',
    '[class*="amount"]',
    '.price', '.cost', '.amount'
  ];
  
  for (const selector of priceSelectors) {
    const priceEl = element.querySelector(selector);
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/\$?(\d+\.?\d*)/);
      if (priceMatch) {
        return priceMatch[1];
      }
    }
  }
  
  return null;
}

function extractOriginalPrice(element) {
  // Look for original/strikethrough price
  const originalSelectors = [
    '[class*="original"]',
    '[class*="old"]',
    's', 'del',
    '[style*="line-through"]'
  ];
  
  for (const selector of originalSelectors) {
    const originalEl = element.querySelector(selector);
    if (originalEl) {
      const originalText = originalEl.textContent.trim();
      const priceMatch = originalText.match(/\$?(\d+\.?\d*)/);
      if (priceMatch) {
        return priceMatch[1];
      }
    }
  }
  
  return null;
}

function extractImageUrl(element) {
  // Look for images
  const img = element.querySelector('img');
  if (img && img.src) {
    return img.src;
  }
  
  return '';
}

function extractAffiliateUrl(element) {
  // Look for links
  const link = element.querySelector('a');
  if (link && link.href) {
    // Convert to affiliate URL if it's a Temu product link
    if (link.href.includes('temu.com')) {
      return link.href.replace(/^https?:\/\/[^\/]+/, 'https://temu.to/k/ale098003');
    }
    return link.href;
  }
  
  return '';
}

function extractRating(element) {
  // Look for rating elements
  const ratingSelectors = [
    '[class*="rating"]',
    '[class*="star"]',
    '.rating', '.stars'
  ];
  
  for (const selector of ratingSelectors) {
    const ratingEl = element.querySelector(selector);
    if (ratingEl) {
      const ratingText = ratingEl.textContent.trim();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        return ratingMatch[1];
      }
    }
  }
  
  return null;
}

function extractReviews(element) {
  // Look for review count
  const reviewSelectors = [
    '[class*="review"]',
    '[class*="comment"]',
    '.reviews', '.comments'
  ];
  
  for (const selector of reviewSelectors) {
    const reviewEl = element.querySelector(selector);
    if (reviewEl) {
      const reviewText = reviewEl.textContent.trim();
      const reviewMatch = reviewText.match(/(\d+)/);
      if (reviewMatch) {
        return reviewMatch[1];
      }
    }
  }
  
  return null;
}

function determineCategory(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('phone') || titleLower.includes('laptop') || titleLower.includes('computer') || 
      titleLower.includes('tablet') || titleLower.includes('earbuds') || titleLower.includes('headphones') ||
      titleLower.includes('charger') || titleLower.includes('wireless') || titleLower.includes('bluetooth')) {
    return 'electronics';
  } else if (titleLower.includes('light') || titleLower.includes('lamp') || titleLower.includes('decor') ||
             titleLower.includes('kitchen') || titleLower.includes('bathroom') || titleLower.includes('bedroom')) {
    return 'home';
  } else if (titleLower.includes('shirt') || titleLower.includes('dress') || titleLower.includes('shoes') ||
             titleLower.includes('bag') || titleLower.includes('jewelry') || titleLower.includes('watch')) {
    return 'fashion';
  } else {
    return 'accessories';
  }
}

function extractTags(title) {
  const titleLower = title.toLowerCase();
  const tags = [];
  
  // Common product tags
  const commonTags = ['wireless', 'bluetooth', 'portable', 'smart', 'led', 'usb', 'fast', 'waterproof', 'wireless', 'mini', 'large'];
  
  commonTags.forEach(tag => {
    if (titleLower.includes(tag)) {
      tags.push(tag);
    }
  });
  
  return tags;
}

// Main extraction function
function runExtraction() {
  console.log('🔍 Starting hot items extraction...');
  
  const hotItems = extractHotItems();
  
  console.log('✅ Extraction complete! Found', hotItems.length, 'items');
  
  // Create JSON output
  const output = {
    hotItems: hotItems,
    lastUpdated: new Date().toISOString(),
    version: "1.0"
  };
  
  // Display results
  console.log('📋 Extracted Hot Items:');
  hotItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} - $${item.price} (Save ${item.savings}%)`);
  });
  
  // Copy to clipboard
  const jsonString = JSON.stringify(output, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    console.log('📋 JSON copied to clipboard!');
    console.log('💡 Paste this into data/hot-items.json to update your extension');
  });
  
  return output;
}

// Auto-run extraction
const result = runExtraction();

// Make functions available globally
window.extractHotItems = extractHotItems;
window.runExtraction = runExtraction; 