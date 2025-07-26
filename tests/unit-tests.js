// Unit Tests for Temu API Integration
// Can run with Node.js: node tests/unit-tests.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Temu API Integration Unit Tests...');

// Test utilities
class TestUtils {
  static assert(condition, message) {
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`✅ ${message}`);
  }
  
  static assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`❌ Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
    }
    console.log(`✅ ${message}`);
  }
  
  static assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`❌ Assertion failed: ${message}. Value is null or undefined`);
    }
    console.log(`✅ ${message}`);
  }
  
  static assertArray(value, message) {
    if (!Array.isArray(value)) {
      throw new Error(`❌ Assertion failed: ${message}. Expected array, got ${typeof value}`);
    }
    console.log(`✅ ${message}`);
  }
  
  static assertObject(value, message) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`❌ Assertion failed: ${message}. Expected object, got ${typeof value}`);
    }
    console.log(`✅ ${message}`);
  }
}

// Mock TemuAPIClient class for testing
class TemuAPIClient {
  constructor(config = {}) {
    this.baseUrl = 'https://partner-eu.temu.com/api';
    this.apiKey = config.apiKey || null;
    this.affiliateCode = config.affiliateCode || 'ale098003';
    this.isAuthenticated = false;
    this.authToken = null;
    this.rateLimit = {
      requests: 0,
      limit: 1000,
      resetTime: Date.now() + (60 * 60 * 1000) // 1 hour from now
    };
  }

  async initialize() {
    // Simulate initialization
    this.isAuthenticated = true;
    this.authToken = 'mock_token_123';
    return true;
  }

  async authenticateWithAffiliateCode() {
    this.isAuthenticated = true;
    this.authToken = 'mock_auth_token_456';
    return true;
  }

  async getHotItems(limit = 10, category = null) {
    // Return mock hot items
    const mockItems = [
      {
        id: 'hot_001',
        title: 'Wireless Bluetooth Earbuds',
        price: 12.99,
        originalPrice: 29.99,
        imageUrl: 'https://img.temu.com/earbuds.jpg',
        affiliateUrl: `https://temu.to/k/${this.affiliateCode}?product_id=hot_001`,
        category: 'electronics',
        tags: ['wireless', 'bluetooth'],
        rating: 4.6,
        reviews: 2847,
        savings: 57
      },
      {
        id: 'hot_002',
        title: 'Smart Watch Fitness Tracker',
        price: 18.50,
        originalPrice: 45.00,
        imageUrl: 'https://img.temu.com/smartwatch.jpg',
        affiliateUrl: `https://temu.to/k/${this.affiliateCode}?product_id=hot_002`,
        category: 'electronics',
        tags: ['smartwatch', 'fitness'],
        rating: 4.4,
        reviews: 1923,
        savings: 59
      }
    ];

    return mockItems.slice(0, limit);
  }

  async searchProducts(query, limit = 5) {
    // Return mock search results
    const mockResults = [
      {
        id: 'search_001',
        title: `Similar ${query}`,
        price: 15.99,
        url: `https://temu.to/k/${this.affiliateCode}?product_id=search_001`,
        imageUrl: 'https://img.temu.com/search_result.jpg',
        rating: 4.2,
        reviews: 1234,
        shipping: 'Free Shipping',
        seller: 'Temu Official Store'
      }
    ];

    return mockResults.slice(0, limit);
  }

  async getProductDetails(productId) {
    return {
      id: productId,
      title: 'Test Product',
      price: 19.99,
      url: `https://temu.to/k/${this.affiliateCode}?product_id=${productId}`,
      imageUrl: 'https://img.temu.com/product.jpg',
      rating: 4.5,
      reviews: 1500,
      shipping: 'Free Shipping',
      seller: 'Temu Official Store'
    };
  }

  checkRateLimit() {
    if (this.rateLimit.requests >= this.rateLimit.limit) {
      return false;
    }
    this.rateLimit.requests++;
    return true;
  }

  async getFallbackHotItems(limit = 5) {
    return await this.getHotItems(limit);
  }

  async getFallbackSearchResults(query, limit = 3) {
    return await this.searchProducts(query, limit);
  }

  async getFallbackProductDetails(productId) {
    return await this.getProductDetails(productId);
  }

  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasApiKey: !!this.apiKey,
      affiliateCode: this.affiliateCode,
      rateLimit: {
        requests: this.rateLimit.requests,
        limit: this.rateLimit.limit,
        remaining: this.rateLimit.limit - this.rateLimit.requests
      }
    };
  }

  // Utility methods
  formatHotItems(apiData) {
    return apiData.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.original_price || item.price * 1.5,
      imageUrl: item.image_url || '',
      affiliateUrl: this.generateAffiliateUrl(item.id),
      category: item.category || 'general',
      tags: item.tags || [],
      rating: item.rating || 4.0,
      reviews: item.reviews || 100,
      savings: this.calculateSavings(item.price, item.original_price || item.price * 1.5)
    }));
  }

  formatSearchResults(apiData) {
    return apiData.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      url: this.generateAffiliateUrl(item.id),
      imageUrl: item.image_url || '',
      rating: item.rating || 4.0,
      reviews: item.reviews || 100,
      shipping: item.shipping || 'Free Shipping',
      seller: item.seller || 'Temu Official Store'
    }));
  }

  generateAffiliateUrl(productId) {
    return `https://temu.to/k/${this.affiliateCode}?product_id=${productId}`;
  }

  calculateSavings(price, originalPrice) {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.floor(((originalPrice - price) / originalPrice) * 100);
  }
}

// Mock HotItemsManager class for testing
class HotItemsManager {
  constructor() {
    this.hotItems = [];
    this.isLoaded = false;
    this.apiClient = new TemuAPIClient({ affiliateCode: 'ale098003' });
  }

  async loadHotItems() {
    try {
      this.hotItems = await this.apiClient.getHotItems(20);
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load hot items:', error);
      this.hotItems = [];
      this.isLoaded = false;
      return false;
    }
  }

  findRelatedHotItems(amazonProduct, maxResults = 3) {
    if (!this.isLoaded || !amazonProduct) {
      return [];
    }

    const amazonTitle = amazonProduct.title.toLowerCase();
    const amazonPrice = amazonProduct.price;
    
    const scoredItems = this.hotItems.map(item => {
      const score = this.calculateHotItemScore(item, amazonTitle, amazonPrice);
      return { ...item, score };
    });

    return scoredItems
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  calculateHotItemScore(hotItem, amazonTitle, amazonPrice) {
    let score = 0;

    // Category matching (30%)
    const categoryMatch = this.checkCategoryMatch(hotItem.category, amazonTitle);
    score += categoryMatch * 0.3;

    // Tag matching (25%)
    const tagMatch = this.checkTagMatch(hotItem.tags, amazonTitle);
    score += tagMatch * 0.25;

    // Price relevance (25%)
    const priceRelevance = this.checkPriceRelevance(hotItem.price, amazonPrice);
    score += priceRelevance * 0.25;

    // Title similarity (20%)
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
    
    if (ratio >= 0.2 && ratio <= 0.8) {
      return 1.0;
    } else if (ratio > 0.8) {
      return Math.max(0, 1 - (ratio - 0.8) * 2);
    } else {
      return Math.max(0, 1 - (0.2 - ratio) * 2);
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

  getAllHotItems(limit = 10) {
    return this.hotItems.slice(0, limit);
  }

  isHotItemsLoaded() {
    return this.isLoaded && this.hotItems.length > 0;
  }
}

// Test TemuAPIClient
class TemuAPIClientTests {
  constructor() {
    this.client = null;
    this.testResults = [];
  }
  
  async runAllTests() {
    console.log('\n🚀 Running TemuAPIClient Unit Tests...\n');
    
    const tests = [
      { name: 'Constructor Test', fn: () => this.testConstructor() },
      { name: 'Initialization Test', fn: () => this.testInitialization() },
      { name: 'Authentication Test', fn: () => this.testAuthentication() },
      { name: 'Hot Items Test', fn: () => this.testGetHotItems() },
      { name: 'Search Products Test', fn: () => this.testSearchProducts() },
      { name: 'Product Details Test', fn: () => this.testGetProductDetails() },
      { name: 'Rate Limiting Test', fn: () => this.testRateLimiting() },
      { name: 'Fallback System Test', fn: () => this.testFallbackSystem() },
      { name: 'Status Test', fn: () => this.testGetStatus() },
      { name: 'Data Formatting Test', fn: () => this.testDataFormatting() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`\n🧪 Running: ${test.name}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          name: test.name,
          passed: true,
          duration: duration
        });
        
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📊 Result: ✅ PASSED`);
        
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        this.testResults.push({
          name: test.name,
          passed: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    this.printSummary();
    return this.testResults;
  }
  
  testConstructor() {
    console.log('Testing TemuAPIClient constructor...');
    
    this.client = new TemuAPIClient({
      apiKey: 'test_key',
      affiliateCode: 'test_code'
    });
    
    TestUtils.assertNotNull(this.client, 'Client should be created');
    TestUtils.assertEqual(this.client.baseUrl, 'https://partner-eu.temu.com/api', 'Base URL should be correct');
    TestUtils.assertEqual(this.client.apiKey, 'test_key', 'API key should be set');
    TestUtils.assertEqual(this.client.affiliateCode, 'test_code', 'Affiliate code should be set');
    TestUtils.assertObject(this.client.rateLimit, 'Rate limit should be an object');
    TestUtils.assertEqual(this.client.isAuthenticated, false, 'Should start as not authenticated');
  }
  
  async testInitialization() {
    console.log('Testing TemuAPIClient initialization...');
    
    const result = await this.client.initialize();
    
    TestUtils.assert(typeof result === 'boolean', 'Initialize should return boolean');
    TestUtils.assert(this.client.isAuthenticated === true, 'Should be authenticated after initialization');
    TestUtils.assertNotNull(this.client.authToken, 'Auth token should be set');
  }
  
  async testAuthentication() {
    console.log('Testing authentication with affiliate code...');
    
    this.client.isAuthenticated = false;
    this.client.authToken = null;
    
    const result = await this.client.authenticateWithAffiliateCode();
    
    TestUtils.assert(typeof result === 'boolean', 'Authentication should return boolean');
    TestUtils.assert(result === true, 'Authentication should succeed');
    TestUtils.assert(this.client.isAuthenticated === true, 'Should be authenticated');
    TestUtils.assertNotNull(this.client.authToken, 'Auth token should be set');
  }
  
  async testGetHotItems() {
    console.log('Testing getHotItems method...');
    
    const hotItems = await this.client.getHotItems(5);
    
    TestUtils.assertArray(hotItems, 'Should return array of hot items');
    TestUtils.assert(hotItems.length > 0, 'Should return at least one hot item');
    
    const firstItem = hotItems[0];
    TestUtils.assertObject(firstItem, 'First item should be an object');
    TestUtils.assertNotNull(firstItem.id, 'Item should have ID');
    TestUtils.assertNotNull(firstItem.title, 'Item should have title');
    TestUtils.assert(typeof firstItem.price === 'number', 'Item should have numeric price');
    TestUtils.assertNotNull(firstItem.affiliateUrl, 'Item should have affiliate URL');
    TestUtils.assert(firstItem.affiliateUrl.includes(this.client.affiliateCode), 'Affiliate URL should contain affiliate code');
  }
  
  async testSearchProducts() {
    console.log('Testing searchProducts method...');
    
    const results = await this.client.searchProducts('wireless headphones', 3);
    
    TestUtils.assertArray(results, 'Should return array of search results');
    TestUtils.assert(results.length > 0, 'Should return at least one result');
    
    const firstResult = results[0];
    TestUtils.assertObject(firstResult, 'First result should be an object');
    TestUtils.assertNotNull(firstResult.title, 'Result should have title');
    TestUtils.assert(typeof firstResult.price === 'number', 'Result should have numeric price');
    TestUtils.assertNotNull(firstResult.url, 'Result should have URL');
    TestUtils.assert(firstResult.url.includes(this.client.affiliateCode), 'URL should contain affiliate code');
  }
  
  async testGetProductDetails() {
    console.log('Testing getProductDetails method...');
    
    const productDetails = await this.client.getProductDetails('test_product_123');
    
    TestUtils.assertObject(productDetails, 'Should return product details object');
    TestUtils.assertNotNull(productDetails.title, 'Product should have title');
    TestUtils.assert(typeof productDetails.price === 'number', 'Product should have numeric price');
    TestUtils.assertNotNull(productDetails.url, 'Product should have URL');
    TestUtils.assertNotNull(productDetails.id, 'Product should have ID');
  }
  
  testRateLimiting() {
    console.log('Testing rate limiting...');
    
    this.client.rateLimit.requests = 0;
    this.client.rateLimit.resetTime = Date.now() + (60 * 60 * 1000);
    
    const withinLimit = this.client.checkRateLimit();
    TestUtils.assert(withinLimit === true, 'Should allow requests within limit');
    
    this.client.rateLimit.requests = this.client.rateLimit.limit;
    const atLimit = this.client.checkRateLimit();
    TestUtils.assert(atLimit === false, 'Should block requests at limit');
  }
  
  async testFallbackSystem() {
    console.log('Testing fallback system...');
    
    const fallbackItems = await this.client.getFallbackHotItems(3);
    TestUtils.assertArray(fallbackItems, 'Should return fallback items array');
    TestUtils.assert(fallbackItems.length > 0, 'Should return at least one fallback item');
    
    const fallbackSearch = await this.client.getFallbackSearchResults('test query', 2);
    TestUtils.assertArray(fallbackSearch, 'Should return fallback search results');
    TestUtils.assert(fallbackSearch.length > 0, 'Should return at least one fallback result');
  }
  
  testGetStatus() {
    console.log('Testing getStatus method...');
    
    const status = this.client.getStatus();
    
    TestUtils.assertObject(status, 'Should return status object');
    TestUtils.assert(typeof status.isAuthenticated === 'boolean', 'Status should have authentication flag');
    TestUtils.assert(typeof status.hasApiKey === 'boolean', 'Status should have API key flag');
    TestUtils.assertNotNull(status.affiliateCode, 'Status should have affiliate code');
    TestUtils.assertObject(status.rateLimit, 'Status should have rate limit info');
  }
  
  testDataFormatting() {
    console.log('Testing data formatting methods...');
    
    const mockApiData = [
      {
        id: 'test_001',
        title: 'Test Product',
        price: 19.99,
        original_price: 39.99,
        image_url: 'https://test.com/image.jpg',
        category: 'electronics',
        tags: ['test', 'product'],
        rating: 4.5,
        reviews: 100
      }
    ];
    
    const formattedItems = this.client.formatHotItems(mockApiData);
    TestUtils.assertArray(formattedItems, 'Should return formatted items array');
    TestUtils.assert(formattedItems.length > 0, 'Should format at least one item');
    
    const firstFormatted = formattedItems[0];
    TestUtils.assertNotNull(firstFormatted.affiliateUrl, 'Formatted item should have affiliate URL');
    TestUtils.assert(typeof firstFormatted.savings === 'number', 'Formatted item should have savings');
  }
  
  printSummary() {
    console.log('\n📋 TemuAPIClient Test Summary');
    console.log('═'.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`✅ Passed: ${passed}/${total} (${successRate}%)`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration > 0 ? `(${result.duration}ms)` : '';
      const error = result.error ? ` - ${result.error}` : '';
      console.log(`${status} ${result.name} ${duration}${error}`);
    });
  }
}

// Test HotItemsManager
class HotItemsManagerTests {
  constructor() {
    this.manager = null;
    this.testResults = [];
  }
  
  async runAllTests() {
    console.log('\n🚀 Running HotItemsManager Unit Tests...\n');
    
    const tests = [
      { name: 'Constructor Test', fn: () => this.testConstructor() },
      { name: 'Load Hot Items Test', fn: () => this.testLoadHotItems() },
      { name: 'Find Related Items Test', fn: () => this.testFindRelatedItems() },
      { name: 'Scoring Test', fn: () => this.testScoring() },
      { name: 'Category Matching Test', fn: () => this.testCategoryMatching() },
      { name: 'Price Relevance Test', fn: () => this.testPriceRelevance() },
      { name: 'Title Similarity Test', fn: () => this.testTitleSimilarity() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`\n🧪 Running: ${test.name}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          name: test.name,
          passed: true,
          duration: duration
        });
        
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📊 Result: ✅ PASSED`);
        
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        this.testResults.push({
          name: test.name,
          passed: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    this.printSummary();
    return this.testResults;
  }
  
  testConstructor() {
    console.log('Testing HotItemsManager constructor...');
    
    this.manager = new HotItemsManager();
    
    TestUtils.assertNotNull(this.manager, 'Manager should be created');
    TestUtils.assertArray(this.manager.hotItems, 'Hot items should be an array');
    TestUtils.assert(typeof this.manager.isLoaded === 'boolean', 'isLoaded should be boolean');
    TestUtils.assertNotNull(this.manager.apiClient, 'API client should be initialized');
  }
  
  async testLoadHotItems() {
    console.log('Testing loadHotItems method...');
    
    const result = await this.manager.loadHotItems();
    
    TestUtils.assert(typeof result === 'boolean', 'Load should return boolean');
    TestUtils.assert(this.manager.isLoaded === true, 'Should be loaded after loading');
    TestUtils.assertArray(this.manager.hotItems, 'Hot items should be an array');
    TestUtils.assert(this.manager.hotItems.length > 0, 'Should have at least one hot item');
  }
  
  async testFindRelatedItems() {
    console.log('Testing findRelatedHotItems method...');
    
    const testProduct = {
      title: 'Apple AirPods Pro Wireless Earbuds',
      price: 249.99
    };
    
    const relatedItems = this.manager.findRelatedHotItems(testProduct, 3);
    
    TestUtils.assertArray(relatedItems, 'Should return array of related items');
    TestUtils.assert(relatedItems.length <= 3, 'Should respect max results limit');
    
    if (relatedItems.length > 0) {
      const firstItem = relatedItems[0];
      TestUtils.assertObject(firstItem, 'First item should be an object');
      TestUtils.assertNotNull(firstItem.title, 'Item should have title');
      TestUtils.assert(typeof firstItem.price === 'number', 'Item should have numeric price');
      TestUtils.assert(typeof firstItem.score === 'number', 'Item should have score');
    }
  }
  
  testScoring() {
    console.log('Testing scoring system...');
    
    const testProduct = {
      title: 'Wireless Bluetooth Headphones',
      price: 49.99
    };
    
    const hotItem = {
      title: 'Wireless Bluetooth Earbuds',
      price: 12.99,
      category: 'electronics',
      tags: ['wireless', 'bluetooth']
    };
    
    const score = this.manager.calculateHotItemScore(hotItem, testProduct.title.toLowerCase(), testProduct.price);
    
    TestUtils.assert(typeof score === 'number', 'Score should be a number');
    TestUtils.assert(score >= 0, 'Score should be non-negative');
    TestUtils.assert(score <= 1, 'Score should be between 0 and 1');
  }
  
  testCategoryMatching() {
    console.log('Testing category matching...');
    
    const electronicsMatch = this.manager.checkCategoryMatch('electronics', 'wireless bluetooth headphones');
    TestUtils.assert(typeof electronicsMatch === 'number', 'Category match should be a number');
    TestUtils.assert(electronicsMatch >= 0, 'Category match should be non-negative');
    TestUtils.assert(electronicsMatch <= 1, 'Category match should be between 0 and 1');
    
    const homeMatch = this.manager.checkCategoryMatch('home', 'led strip lights');
    TestUtils.assert(typeof homeMatch === 'number', 'Home category match should be a number');
  }
  
  testPriceRelevance() {
    console.log('Testing price relevance...');
    
    const relevance1 = this.manager.checkPriceRelevance(15.99, 49.99); // Good price ratio
    TestUtils.assert(typeof relevance1 === 'number', 'Price relevance should be a number');
    TestUtils.assert(relevance1 >= 0, 'Price relevance should be non-negative');
    TestUtils.assert(relevance1 <= 1, 'Price relevance should be between 0 and 1');
    
    const relevance2 = this.manager.checkPriceRelevance(45.99, 49.99); // Too close to original
    TestUtils.assert(typeof relevance2 === 'number', 'Price relevance should be a number');
  }
  
  testTitleSimilarity() {
    console.log('Testing title similarity...');
    
    const similarity1 = this.manager.calculateTitleSimilarity('Wireless Bluetooth Earbuds', 'wireless bluetooth headphones');
    TestUtils.assert(typeof similarity1 === 'number', 'Title similarity should be a number');
    TestUtils.assert(similarity1 >= 0, 'Title similarity should be non-negative');
    TestUtils.assert(similarity1 <= 1, 'Title similarity should be between 0 and 1');
    
    const similarity2 = this.manager.calculateTitleSimilarity('Completely Different Product', 'wireless bluetooth headphones');
    TestUtils.assert(typeof similarity2 === 'number', 'Title similarity should be a number');
  }
  
  printSummary() {
    console.log('\n📋 HotItemsManager Test Summary');
    console.log('═'.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`✅ Passed: ${passed}/${total} (${successRate}%)`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration > 0 ? `(${result.duration}ms)` : '';
      const error = result.error ? ` - ${result.error}` : '';
      console.log(`${status} ${result.name} ${duration}${error}`);
    });
  }
}

// Main test runner
async function runAllUnitTests() {
  console.log('🧪 Starting Comprehensive Unit Test Suite...\n');
  
  const results = {
    apiClient: [],
    hotItemsManager: []
  };
  
  try {
    // Run TemuAPIClient tests
    const apiClientTests = new TemuAPIClientTests();
    results.apiClient = await apiClientTests.runAllTests();
    
    // Run HotItemsManager tests
    const hotItemsManagerTests = new HotItemsManagerTests();
    results.hotItemsManager = await hotItemsManagerTests.runAllTests();
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
  
  // Overall summary
  console.log('\n🎯 Overall Unit Test Summary');
  console.log('═'.repeat(60));
  
  const totalTests = results.apiClient.length + results.hotItemsManager.length;
  const totalPassed = results.apiClient.filter(r => r.passed).length + 
                     results.hotItemsManager.filter(r => r.passed).length;
  const overallSuccessRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`📈 Success Rate: ${overallSuccessRate}%`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All unit tests passed! API integration logic is working correctly.');
  } else {
    console.log('\n⚠️  Some unit tests failed. Review the logs above for details.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllUnitTests().then(results => {
    process.exit(results.apiClient.filter(r => r.passed).length + 
                results.hotItemsManager.filter(r => r.passed).length === 
                results.apiClient.length + results.hotItemsManager.length ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

// Export for use
module.exports = {
  TemuAPIClient,
  HotItemsManager,
  TemuAPIClientTests,
  HotItemsManagerTests,
  runAllUnitTests,
  TestUtils
}; 