// Hot Items Manager for Temu Price Comparison Extension
// Handles loading, searching, and matching hot items with Amazon products

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
      console.log('Temu Price Comparison: Loaded', this.hotItems.length, 'hot items');
    } catch (error) {
      console.error('Temu Price Comparison: Failed to load hot items:', error);
      this.hotItems = [];
      this.isLoaded = false;
    }
  }

  // Find related hot items based on Amazon product
  findRelatedHotItems(amazonProduct, maxResults = 3) {
    if (!this.isLoaded || !amazonProduct) {
      return [];
    }

    const amazonTitle = amazonProduct.title.toLowerCase();
    const amazonPrice = amazonProduct.price;
    
    // Score each hot item based on relevance
    const scoredItems = this.hotItems.map(item => {
      const score = this.calculateHotItemScore(item, amazonTitle, amazonPrice);
      return { ...item, score };
    });

    // Sort by score and return top results
    return scoredItems
      .filter(item => item.score > 0.3) // Only show relevant items
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  calculateHotItemScore(hotItem, amazonTitle, amazonPrice) {
    let score = 0;

    // 1. Category matching (30%)
    const categoryMatch = this.checkCategoryMatch(hotItem.category, amazonTitle);
    score += categoryMatch * 0.3;

    // 2. Tag matching (25%)
    const tagMatch = this.checkTagMatch(hotItem.tags, amazonTitle);
    score += tagMatch * 0.25;

    // 3. Price relevance (25%)
    const priceRelevance = this.checkPriceRelevance(hotItem.price, amazonPrice);
    score += priceRelevance * 0.25;

    // 4. Title similarity (20%)
    const titleSimilarity = this.calculateTitleSimilarity(hotItem.title, amazonTitle);
    score += titleSimilarity * 0.2;

    return score;
  }

  checkCategoryMatch(hotItemCategory, amazonTitle) {
    const categoryKeywords = {
      'electronics': ['phone', 'laptop', 'computer', 'tablet', 'earbuds', 'headphones', 'charger', 'cable', 'wireless', 'bluetooth'],
      'home': ['light', 'lamp', 'decor', 'kitchen', 'bathroom', 'bedroom', 'living', 'furniture'],
      'fashion': ['shirt', 'dress', 'shoes', 'bag', 'jewelry', 'watch', 'accessory'],
      'accessories': ['case', 'holder', 'stand', 'cover', 'protector', 'mount']
    };

    const keywords = categoryKeywords[hotItemCategory] || [];
    const matches = keywords.filter(keyword => amazonTitle.includes(keyword));
    return matches.length / Math.max(keywords.length, 1);
  }

  checkTagMatch(tags, amazonTitle) {
    if (!tags || tags.length === 0) return 0;
    const matches = tags.filter(tag => amazonTitle.includes(tag));
    return matches.length / tags.length;
  }

  checkPriceRelevance(hotItemPrice, amazonPrice) {
    if (!amazonPrice || amazonPrice <= 0) return 0.5;
    
    const ratio = hotItemPrice / amazonPrice;
    
    // Prefer items that are 20-80% of Amazon price
    if (ratio >= 0.2 && ratio <= 0.8) {
      return 1.0;
    } else if (ratio > 0.8) {
      return Math.max(0, 1 - (ratio - 0.8) * 2); // Penalize if too close to Amazon price
    } else {
      return Math.max(0, 1 - (0.2 - ratio) * 2); // Penalize if too cheap (might be low quality)
    }
  }

  calculateTitleSimilarity(hotItemTitle, amazonTitle) {
    const hotWords = hotItemTitle.toLowerCase().split(/\s+/);
    const amazonWords = amazonTitle.toLowerCase().split(/\s+/);
    
    const commonWords = hotWords.filter(word => 
      amazonWords.some(amazonWord => 
        amazonWord.includes(word) || word.includes(amazonWord)
      )
    );
    
    return commonWords.length / Math.max(hotWords.length, 1);
  }

  // Get hot items by category
  getHotItemsByCategory(category, limit = 5) {
    return this.hotItems
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  // Get all hot items (for browsing)
  getAllHotItems(limit = 10) {
    return this.hotItems.slice(0, limit);
  }

  // Check if hot items are loaded
  isHotItemsLoaded() {
    return this.isLoaded && this.hotItems.length > 0;
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HotItemsManager;
} 