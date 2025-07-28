// SmartSave - Popup Script
// Handles popup interface functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('SmartSave: Popup loaded');
  
  // Initialize popup
  initializePopup();
  
  // Load hot items
  loadHotItems();
});

function initializePopup() {
  // Initialize popup UI
  console.log('SmartSave: Popup initialized');
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
    const card = createHotItemCard(item);
    hotItemsList.appendChild(card);
  });
}

function createHotItemCard(item) {
  const card = document.createElement('div');
  card.className = 'hot-item-card';
  card.setAttribute('data-url', item.affiliateUrl);
  
  // Add click handler to open affiliate URL
  card.addEventListener('click', function() {
    const url = this.getAttribute('data-url');
    if (url) {
      chrome.tabs.create({ url: url });
      showNotification('Opening Temu storefront...');
    }
  });
  
  card.innerHTML = `
    <div class="hot-item-content">
      <img src="${item.imageUrl}" alt="${item.title}" class="hot-item-image" onerror="this.src='https://via.placeholder.com/80x80?text=SmartSave'">
      <div class="hot-item-info">
        <div class="hot-item-header">
          <h4 class="hot-item-title">${item.title}</h4>
          <div class="hot-item-price">
            <div class="current-price">$${item.price.toFixed(2)}</div>
            <div class="original-price">$${item.originalPrice.toFixed(2)}</div>
          </div>
        </div>
        
        <div class="hot-item-details">
          <div class="hot-item-stats">
            <span>⭐ ${item.rating}</span>
            <span>📊 ${item.salesCount}</span>
          </div>
          <div class="hot-item-savings">Save ${item.savings}%</div>
        </div>
        
        <div class="hot-item-description">${item.description}</div>
        
        <div class="hot-item-tags">
          ${item.tags.map(tag => `<span class="hot-item-tag">${tag}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
  
  return card;
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