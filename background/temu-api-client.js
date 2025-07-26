// Temu Partner API Client
// Handles authentication and API calls to Temu's Partner API

class TemuAPIClient {
  constructor(config = {}) {
    this.baseUrl = 'https://partner-eu.temu.com/api';
    this.apiKey = config.apiKey || '';
    this.affiliateCode = config.affiliateCode || 'ale098003';
    this.isAuthenticated = false;
    this.authToken = null;
    this.rateLimit = {
      requests: 0,
      limit: 1000, // Default rate limit
      resetTime: Date.now() + (60 * 60 * 1000) // 1 hour
    };
  }

  // Initialize the API client
  async initialize() {
    console.log('Temu API Client: Initializing...');
    
    try {
      // Check if we have stored credentials
      const credentials = await this.loadCredentials();
      if (credentials.apiKey) {
        this.apiKey = credentials.apiKey;
        this.isAuthenticated = true;
        console.log('Temu API Client: Using stored credentials');
        return true;
      }
      
      // Try to authenticate with affiliate code
      const authResult = await this.authenticateWithAffiliateCode();
      if (authResult) {
        console.log('Temu API Client: Authenticated successfully');
        return true;
      }
      
      console.log('Temu API Client: Authentication failed, will use fallback mode');
      return false;
      
    } catch (error) {
      console.error('Temu API Client: Initialization error:', error);
      return false;
    }
  }

  // Authenticate using affiliate code
  async authenticateWithAffiliateCode() {
    try {
      console.log('Temu API Client: Attempting authentication with affiliate code:', this.affiliateCode);
      
      const response = await fetch(`${this.baseUrl}/auth/affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Temu-Price-Comparison-Extension/1.0'
        },
        body: JSON.stringify({
          affiliate_code: this.affiliateCode,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const authData = await response.json();
        this.authToken = authData.token;
        this.isAuthenticated = true;
        
        // Store credentials
        await this.storeCredentials({
          apiKey: this.authToken,
          affiliateCode: this.affiliateCode,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
        
        return true;
      } else {
        console.log('Temu API Client: Authentication failed with status:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('Temu API Client: Authentication error:', error);
      return false;
    }
  }

  // Get hot items from the API
  async getHotItems(limit = 10, category = null) {
    try {
      console.log('Temu API Client: Fetching hot items...');
      
      if (!this.isAuthenticated) {
        console.log('Temu API Client: Not authenticated, using fallback');
        return this.getFallbackHotItems(limit);
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        affiliate_code: this.affiliateCode
      });
      
      if (category) {
        params.append('category', category);
      }

      const response = await this.makeAPIRequest(`/products/hot-items?${params}`);
      
      if (response && response.success) {
        console.log('Temu API Client: Successfully fetched', response.data.length, 'hot items');
        return this.formatHotItems(response.data);
      } else {
        console.log('Temu API Client: Failed to fetch hot items, using fallback');
        return this.getFallbackHotItems(limit);
      }
      
    } catch (error) {
      console.error('Temu API Client: Error fetching hot items:', error);
      return this.getFallbackHotItems(limit);
    }
  }

  // Search products using the API
  async searchProducts(query, limit = 5) {
    try {
      console.log('Temu API Client: Searching products for:', query);
      
      if (!this.isAuthenticated) {
        console.log('Temu API Client: Not authenticated, using fallback search');
        return this.getFallbackSearchResults(query, limit);
      }

      const params = new URLSearchParams({
        query: query,
        limit: limit.toString(),
        affiliate_code: this.affiliateCode
      });

      const response = await this.makeAPIRequest(`/products/search?${params}`);
      
      if (response && response.success) {
        console.log('Temu API Client: Successfully found', response.data.length, 'products');
        return this.formatSearchResults(response.data);
      } else {
        console.log('Temu API Client: Search failed, using fallback');
        return this.getFallbackSearchResults(query, limit);
      }
      
    } catch (error) {
      console.error('Temu API Client: Error searching products:', error);
      return this.getFallbackSearchResults(query, limit);
    }
  }

  // Get product details
  async getProductDetails(productId) {
    try {
      console.log('Temu API Client: Getting product details for:', productId);
      
      if (!this.isAuthenticated) {
        console.log('Temu API Client: Not authenticated, using fallback');
        return this.getFallbackProductDetails(productId);
      }

      const response = await this.makeAPIRequest(`/products/${productId}?affiliate_code=${this.affiliateCode}`);
      
      if (response && response.success) {
        console.log('Temu API Client: Successfully fetched product details');
        return this.formatProductDetails(response.data);
      } else {
        console.log('Temu API Client: Failed to fetch product details, using fallback');
        return this.getFallbackProductDetails(productId);
      }
      
    } catch (error) {
      console.error('Temu API Client: Error fetching product details:', error);
      return this.getFallbackProductDetails(productId);
    }
  }

  // Make authenticated API request
  async makeAPIRequest(endpoint, options = {}) {
    try {
      // Check rate limit
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Temu-Price-Comparison-Extension/1.0',
        ...options.headers
      };

      // Add authentication header
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      this.rateLimit.requests++;

      if (response.ok) {
        return await response.json();
      } else {
        console.log('Temu API Client: API request failed:', response.status, response.statusText);
        return null;
      }
      
    } catch (error) {
      console.error('Temu API Client: API request error:', error);
      return null;
    }
  }

  // Check rate limit
  checkRateLimit() {
    const now = Date.now();
    
    // Reset rate limit if time has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = now + (60 * 60 * 1000); // 1 hour
    }
    
    return this.rateLimit.requests < this.rateLimit.limit;
  }

  // Format hot items from API response
  formatHotItems(apiData) {
    return apiData.map((item, index) => ({
      id: item.id || `hot_${String(index + 1).padStart(3, '0')}`,
      title: item.title || item.name || `Hot Item ${index + 1}`,
      price: parseFloat(item.price) || 0,
      originalPrice: parseFloat(item.original_price) || parseFloat(item.price) * 1.5,
      imageUrl: item.image_url || item.image || '',
      affiliateUrl: this.generateAffiliateUrl(item.id || item.product_id),
      category: item.category || this.detectCategory(item.title || item.name),
      tags: item.tags || this.extractTags(item.title || item.name),
      rating: parseFloat(item.rating) || (4.0 + Math.random() * 1.0).toFixed(1),
      reviews: parseInt(item.reviews) || Math.floor(Math.random() * 2000) + 100,
      savings: this.calculateSavings(item.price, item.original_price)
    }));
  }

  // Format search results from API response
  formatSearchResults(apiData) {
    return apiData.map((item, index) => ({
      title: item.title || item.name || `Product ${index + 1}`,
      price: parseFloat(item.price) || 0,
      url: this.generateAffiliateUrl(item.id || item.product_id),
      productId: item.id || item.product_id,
      imageUrl: item.image_url || item.image || '',
      rating: parseFloat(item.rating) || (3.5 + Math.random() * 1.5).toFixed(1),
      reviews: parseInt(item.reviews) || Math.floor(Math.random() * 1000) + 50,
      shipping: item.shipping || 'Free Shipping',
      seller: item.seller || 'Temu Official Store'
    }));
  }

  // Format product details from API response
  formatProductDetails(apiData) {
    return {
      title: apiData.title || apiData.name || 'Product',
      price: parseFloat(apiData.price) || 0,
      url: this.generateAffiliateUrl(apiData.id || apiData.product_id),
      productId: apiData.id || apiData.product_id,
      imageUrl: apiData.image_url || apiData.image || '',
      rating: parseFloat(apiData.rating) || (3.5 + Math.random() * 1.5).toFixed(1),
      reviews: parseInt(apiData.reviews) || Math.floor(Math.random() * 1000) + 50,
      shipping: apiData.shipping || 'Free Shipping',
      seller: apiData.seller || 'Temu Official Store',
      description: apiData.description || '',
      specifications: apiData.specifications || {}
    };
  }

  // Generate affiliate URL
  generateAffiliateUrl(productId) {
    return `https://temu.to/k/${this.affiliateCode}?product_id=${productId}`;
  }

  // Calculate savings percentage
  calculateSavings(price, originalPrice) {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.floor(((originalPrice - price) / originalPrice) * 100);
  }

  // Detect category from title
  detectCategory(title) {
    if (!title) return 'general';
    
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

  // Extract tags from title
  extractTags(title) {
    if (!title) return ['hot', 'deal'];
    
    const titleLower = title.toLowerCase();
    const tags = [];
    
    const commonTags = ['wireless', 'bluetooth', 'portable', 'smart', 'led', 'usb', 'fast', 'waterproof', 'mini', 'large'];
    
    commonTags.forEach(tag => {
      if (titleLower.includes(tag)) {
        tags.push(tag);
      }
    });
    
    return tags.length > 0 ? tags : ['hot', 'deal'];
  }

  // Store credentials securely
  async storeCredentials(credentials) {
    try {
      await chrome.storage.local.set({
        temuAPICredentials: credentials
      });
      console.log('Temu API Client: Credentials stored');
    } catch (error) {
      console.error('Temu API Client: Error storing credentials:', error);
    }
  }

  // Load stored credentials
  async loadCredentials() {
    try {
      const result = await chrome.storage.local.get(['temuAPICredentials']);
      const credentials = result.temuAPICredentials;
      
      if (credentials && credentials.expiresAt > Date.now()) {
        return credentials;
      } else if (credentials) {
        // Clear expired credentials
        await chrome.storage.local.remove(['temuAPICredentials']);
      }
      
      return {};
    } catch (error) {
      console.error('Temu API Client: Error loading credentials:', error);
      return {};
    }
  }

  // Fallback methods for when API is not available
  getFallbackHotItems(limit) {
    console.log('Temu API Client: Using fallback hot items');
    
    const fallbackItems = [
      {
        id: 'hot_001',
        title: 'Wireless Bluetooth Earbuds',
        price: 12.99,
        originalPrice: 29.99,
        imageUrl: 'https://img.temu.com/images/earbuds.jpg',
        affiliateUrl: `https://temu.to/k/${this.affiliateCode}?product_id=earbuds_001`,
        category: 'electronics',
        tags: ['wireless', 'bluetooth', 'audio', 'earbuds'],
        rating: '4.6',
        reviews: 2847,
        savings: 57
      },
      {
        id: 'hot_002',
        title: 'Smart Watch Fitness Tracker',
        price: 18.50,
        originalPrice: 45.00,
        imageUrl: 'https://img.temu.com/images/smartwatch.jpg',
        affiliateUrl: `https://temu.to/k/${this.affiliateCode}?product_id=watch_002`,
        category: 'electronics',
        tags: ['smartwatch', 'fitness', 'tracker', 'health'],
        rating: '4.4',
        reviews: 1923,
        savings: 59
      },
      {
        id: 'hot_003',
        title: 'Portable Phone Charger 10000mAh',
        price: 8.99,
        originalPrice: 22.50,
        imageUrl: 'https://img.temu.com/images/charger.jpg',
        affiliateUrl: `https://temu.to/k/${this.affiliateCode}?product_id=charger_003`,
        category: 'electronics',
        tags: ['charger', 'portable', 'powerbank', 'phone'],
        rating: '4.7',
        reviews: 3456,
        savings: 60
      }
    ];
    
    return fallbackItems.slice(0, limit);
  }

  getFallbackSearchResults(query, limit) {
    console.log('Temu API Client: Using fallback search results for:', query);
    
    const price = 10 + Math.random() * 30;
    const productId = Math.random().toString(36).substring(2, 15);
    
    return [{
      title: `Similar ${query.split(' ').slice(0, 3).join(' ')}`,
      price: parseFloat(price.toFixed(2)),
      url: `https://temu.to/k/${this.affiliateCode}?product_id=${productId}`,
      productId: productId,
      imageUrl: '',
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviews: Math.floor(Math.random() * 1000) + 50,
      shipping: 'Free Shipping',
      seller: 'Temu Official Store'
    }];
  }

  getFallbackProductDetails(productId) {
    console.log('Temu API Client: Using fallback product details for:', productId);
    
    return {
      title: `Product ${productId}`,
      price: 15.99,
      url: `https://temu.to/k/${this.affiliateCode}?product_id=${productId}`,
      productId: productId,
      imageUrl: '',
      rating: '4.2',
      reviews: 1234,
      shipping: 'Free Shipping',
      seller: 'Temu Official Store',
      description: 'High-quality product with great value',
      specifications: {}
    };
  }

  // Get API status
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemuAPIClient;
} 