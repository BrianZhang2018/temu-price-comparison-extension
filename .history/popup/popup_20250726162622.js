// Temu Price Comparison - Popup Script
// Handles popup interface functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Temu Price Comparison: Popup loaded');
  
  // Initialize popup
  initializePopup();
  
  // Load current data
  loadCurrentData();
  
  // Set up event listeners
  setupEventListeners();
});

function initializePopup() {
  // Initialize popup UI
  console.log('Temu Price Comparison: Popup initialized');
}

function loadCurrentData() {
  // Load hot items
  loadHotItems();
  
  // Load extension stats
  chrome.storage.local.get(['extensionData'], (result) => {
    const data = result.extensionData || {
      searches: 0,
      savings: 0
    };
    
    document.getElementById('searches').textContent = data.searches;
    document.getElementById('savings').textContent = `$${data.savings.toFixed(2)}`;
  });
  
  // Update status
  document.getElementById('status').textContent = 'Ready';
  }



function setupEventListeners() {
  // Action buttons
  document.getElementById('refresh-hot-items').addEventListener('click', function() {
    refreshHotItems();
  });
}



function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function loadHotItems() {
  const hotItemsList = document.getElementById('hot-items-list');
  hotItemsList.innerHTML = '<div class="loading">Loading hot items...</div>';
  
  chrome.runtime.sendMessage({ action: 'getHotItems' }, (response) => {
    if (response && response.success && response.hotItems && response.hotItems.length > 0) {
      displayHotItems(response.hotItems);
    } else {
      hotItemsList.innerHTML = '<div class="no-hot-items">No hot items available</div>';
    }
  });
}

function displayHotItems(hotItems) {
  const hotItemsList = document.getElementById('hot-items-list');
  hotItemsList.innerHTML = '';
  
  hotItems.forEach(item => {
    const hotItemElement = document.createElement('div');
    hotItemElement.className = 'hot-item';
    
    const savings = item.originalPrice > item.price ? 
      Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 
      item.savings || 0;
    
    hotItemElement.innerHTML = `
      <div class="hot-item-content">
        <img src="${item.imageUrl || 'https://via.placeholder.com/50x50?text=Item'}" 
             alt="${item.title}" 
             class="hot-item-image"
             onerror="this.src='https://via.placeholder.com/50x50?text=Item'">
        <div class="hot-item-info">
          <div class="hot-item-title">${item.title}</div>
          <div class="hot-item-price">
            <span class="hot-item-current-price">$${item.price}</span>
            ${item.originalPrice ? `<span class="hot-item-original-price">$${item.originalPrice}</span>` : ''}
            ${savings > 0 ? `<span class="hot-item-savings">Save ${savings}%</span>` : ''}
          </div>
          <div class="hot-item-meta">
            <div class="hot-item-rating">⭐ ${item.rating || '4.5'}</div>
            <span>(${item.reviews || '1K+'} reviews)</span>
          </div>
        </div>
      </div>
    `;
    
    hotItemElement.addEventListener('click', () => {
      console.log('Opening hot item:', item.affiliateUrl || item.url);
      chrome.tabs.create({ url: item.affiliateUrl || item.url });
    });
    
    hotItemsList.appendChild(hotItemElement);
  });
}

function refreshHotItems() {
  document.getElementById('status').textContent = 'Refreshing hot items...';
  
  // Refresh hot items in background
  chrome.runtime.sendMessage({ action: 'refreshHotItems' }, (response) => {
    if (response && response.success) {
      document.getElementById('status').textContent = `Hot items refreshed (${response.count} items)`;
      // Reload the hot items list
      loadHotItems();
    } else {
      document.getElementById('status').textContent = 'Failed to refresh hot items';
    }
  });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    document.getElementById('searches').textContent = request.searches;
    document.getElementById('savings').textContent = `$${request.savings.toFixed(2)}`;
  }
}); 