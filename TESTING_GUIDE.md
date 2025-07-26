# Testing Guide for Temu API Integration

This guide explains how to test the Temu API integration using comprehensive unit tests that can run independently without a browser environment.

## 🧪 Overview

The testing suite includes:
- **Unit Tests**: Test core logic without browser dependencies
- **Integration Tests**: Test browser extension functionality
- **Performance Tests**: Benchmark API performance
- **Verification Tests**: Quick health checks

## 🚀 Quick Start

### Run All Unit Tests
```bash
node run-tests.js
```

### Run Specific Test Categories
```bash
# API Client tests only
node run-tests.js --api-only

# Hot Items Manager tests only
node run-tests.js --hot-items-only

# Verbose output
node run-tests.js --verbose
```

### Direct Unit Test Execution
```bash
node tests/unit-tests.js
```

## 📋 Test Categories

### 1. TemuAPIClient Tests (10 tests)

Tests the core API client functionality:

- **Constructor Test**: Verifies proper initialization
- **Initialization Test**: Tests client setup and authentication
- **Authentication Test**: Tests affiliate code authentication
- **Hot Items Test**: Tests fetching hot items from API
- **Search Products Test**: Tests product search functionality
- **Product Details Test**: Tests individual product retrieval
- **Rate Limiting Test**: Tests API rate limiting logic
- **Fallback System Test**: Tests fallback mechanisms
- **Status Test**: Tests client status reporting
- **Data Formatting Test**: Tests response data formatting

### 2. HotItemsManager Tests (7 tests)

Tests the hot items management system:

- **Constructor Test**: Verifies manager initialization
- **Load Hot Items Test**: Tests hot items loading
- **Find Related Items Test**: Tests product matching
- **Scoring Test**: Tests relevance scoring algorithm
- **Category Matching Test**: Tests category-based matching
- **Price Relevance Test**: Tests price-based relevance
- **Title Similarity Test**: Tests title similarity calculation

## 🔧 Test Architecture

### Mock Classes

The unit tests use mock implementations that simulate the real API behavior:

```javascript
// Mock TemuAPIClient
class TemuAPIClient {
  constructor(config = {}) {
    this.baseUrl = 'https://partner-eu.temu.com/api';
    this.affiliateCode = config.affiliateCode || 'ale098003';
    // ... other properties
  }
  
  async getHotItems(limit = 10) {
    // Returns mock hot items data
  }
  
  async searchProducts(query, limit = 5) {
    // Returns mock search results
  }
  // ... other methods
}
```

### Test Utilities

```javascript
class TestUtils {
  static assert(condition, message)
  static assertEqual(actual, expected, message)
  static assertNotNull(value, message)
  static assertArray(value, message)
  static assertObject(value, message)
}
```

## 📊 Test Results

### Success Criteria
- **All tests must pass** (100% success rate)
- **No runtime errors**
- **Proper data structures returned**
- **Correct affiliate code integration**

### Example Output
```
🎯 Final Test Summary
════════════════════════════════════════════════════════════
📊 Total Tests: 17
✅ Total Passed: 17
❌ Total Failed: 0
📈 Success Rate: 100.0%

🎉 ALL TESTS PASSED!
✅ Temu API integration is working correctly.
✅ All core functionality has been verified.
```

## 🧪 Individual Test Details

### TemuAPIClient Constructor Test
```javascript
testConstructor() {
  this.client = new TemuAPIClient({
    apiKey: 'test_key',
    affiliateCode: 'test_code'
  });
  
  TestUtils.assertNotNull(this.client, 'Client should be created');
  TestUtils.assertEqual(this.client.baseUrl, 'https://partner-eu.temu.com/api');
  TestUtils.assertEqual(this.client.affiliateCode, 'test_code');
}
```

### Hot Items Loading Test
```javascript
async testLoadHotItems() {
  const hotItems = await this.client.getHotItems(5);
  
  TestUtils.assertArray(hotItems, 'Should return array of hot items');
  TestUtils.assert(hotItems.length > 0, 'Should return at least one hot item');
  
  const firstItem = hotItems[0];
  TestUtils.assertNotNull(firstItem.id, 'Item should have ID');
  TestUtils.assertNotNull(firstItem.title, 'Item should have title');
  TestUtils.assert(typeof firstItem.price === 'number', 'Item should have numeric price');
}
```

### Scoring Algorithm Test
```javascript
testScoring() {
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
  
  const score = this.manager.calculateHotItemScore(
    hotItem, 
    testProduct.title.toLowerCase(), 
    testProduct.price
  );
  
  TestUtils.assert(typeof score === 'number', 'Score should be a number');
  TestUtils.assert(score >= 0, 'Score should be non-negative');
  TestUtils.assert(score <= 1, 'Score should be between 0 and 1');
}
```

## 🔍 Debugging Failed Tests

### Common Issues

1. **Affiliate Code Mismatch**
   ```
   ❌ Assertion failed: Affiliate URL should contain affiliate code
   ```
   - Check that affiliate URLs are properly generated
   - Verify affiliate code is correctly set in constructor

2. **Async/Await Issues**
   ```
   ❌ Assertion failed: Should return fallback items array. Expected array, got object
   ```
   - Ensure async methods are properly awaited
   - Check that fallback methods return arrays

3. **Data Type Issues**
   ```
   ❌ Assertion failed: Item should have numeric price. Expected number, got string
   ```
   - Verify price values are numbers, not strings
   - Check data formatting methods

### Debugging Steps

1. **Run with verbose output**:
   ```bash
   node run-tests.js --verbose
   ```

2. **Run specific test category**:
   ```bash
   node run-tests.js --api-only
   ```

3. **Check individual test**:
   ```javascript
   // In tests/unit-tests.js, add console.log statements
   console.log('Debug data:', data);
   ```

## 🚀 Continuous Integration

### Automated Testing
The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: node run-tests.js
  
- name: Check Test Results
  run: |
    if [ $? -ne 0 ]; then
      echo "Tests failed!"
      exit 1
    fi
```

### Pre-commit Hooks
```bash
#!/bin/bash
# pre-commit hook
echo "Running Temu API integration tests..."
node run-tests.js
if [ $? -ne 0 ]; then
  echo "Tests failed! Commit aborted."
  exit 1
fi
```

## 📈 Performance Testing

### Benchmark Tests
```javascript
async function runPerformanceBenchmark() {
  const benchmarks = [
    { name: 'API Client Initialization', fn: async () => {
      const start = Date.now();
      await chrome.runtime.sendMessage({ action: 'testAPIClient' });
      return Date.now() - start;
    }},
    // ... more benchmarks
  ];
}
```

### Performance Criteria
- **API Client Initialization**: < 1000ms
- **Hot Items Loading**: < 2000ms
- **Product Search**: < 1500ms
- **Full Product Search**: < 3000ms

## 🔧 Test Configuration

### Environment Variables
```bash
# Optional: Set test environment
export TEMU_TEST_ENV=development
export TEMU_TEST_AFFILIATE_CODE=test_code
```

### Test Data
Mock data is defined in the test files:
```javascript
const mockItems = [
  {
    id: 'hot_001',
    title: 'Wireless Bluetooth Earbuds',
    price: 12.99,
    originalPrice: 29.99,
    // ... other properties
  }
];
```

## 📝 Adding New Tests

### 1. Create Test Method
```javascript
async testNewFeature() {
  console.log('Testing new feature...');
  
  // Test logic here
  const result = await this.client.newFeature();
  
  TestUtils.assertNotNull(result, 'Result should not be null');
  TestUtils.assertArray(result, 'Result should be an array');
}
```

### 2. Add to Test Suite
```javascript
const tests = [
  // ... existing tests
  { name: 'New Feature Test', fn: () => this.testNewFeature() }
];
```

### 3. Run Tests
```bash
node run-tests.js
```

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Don't rely on real API calls
3. **Clear Assertions**: Use descriptive assertion messages
4. **Async Handling**: Properly handle async/await
5. **Data Validation**: Test data types and structures
6. **Error Cases**: Test error conditions and edge cases

## 🔗 Related Files

- `tests/unit-tests.js` - Main unit test suite
- `run-tests.js` - Test runner with options
- `test-api-integration.js` - Browser integration tests
- `test-verification.js` - Quick verification tests
- `API_INTEGRATION_GUIDE.md` - API integration documentation

## 📞 Support

If tests are failing or you need help:

1. Check the test output for specific error messages
2. Review the failing test logic
3. Verify the implementation matches test expectations
4. Run tests with verbose output for more details

---

**Note**: These unit tests verify the core logic and data structures. For full browser extension testing, use the integration tests in the browser console. 