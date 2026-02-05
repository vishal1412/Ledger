// ===================================
// HYBRID STORAGE MANAGER (Server + Local)
// ===================================
console.log('📦 STORAGE.JS FILE LOADING...');

class StorageManager {
  constructor() {
    this.serverUrl = 'https://ledger-kappa-sage.vercel.app/api';
    this.isOnline = false;
    this.imagePath = './images/'; // Default fallback

    // Attempt to initialize connection
    this.checkServerConnection();
    this.initializeStorage();
  }

  async checkServerConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/storage/settings`);
      this.isOnline = response.ok;
      if (this.isOnline) {
        console.log('✅ Connected to Local Storage Server');
        await this.syncFromServer();
      }
    } catch (e) {
      console.warn('⚠️ Server not found. Running in Offline Mode (LocalStorage only).');
      this.isOnline = false;
    }
  }

  // Load all data from server to local cache
  async syncFromServer() {
    const collections = ['parties', 'purchases', 'sales', 'payments', 'stock', 'settings', 'stock_movements', 'alerts'];

    console.log('🔄 Syncing data from server...');
    for (const collection of collections) {
      try {
        const response = await fetch(`${this.serverUrl}/storage/${collection}`);
        if (response.ok) {
          const data = await response.json();
          // Only update local if server has data
          if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem(`business_ledger_${collection}`, JSON.stringify(data));
          } else if (typeof data === 'object' && Object.keys(data).length > 0 && !Array.isArray(data)) {
            localStorage.setItem(`business_ledger_${collection}`, JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error(`Failed to sync ${collection}`, e);
      }
    }
    console.log('✅ Sync complete');
    // Dispatch event to refresh UI if needed
    window.dispatchEvent(new CustomEvent('storage-synced'));
  }

  // Initialize storage with default data structures
  initializeStorage() {
    const defaults = {
      parties: [],
      purchases: [],
      sales: [],
      payments: [],
      stock: [],
      settings: {
        lowStockThreshold: 10,
        currency: '₹'
      }
    };

    Object.keys(defaults).forEach(key => {
      if (!this.getData(key)) {
        this.saveData(key, defaults[key], false); // Don't sync defaults back to server immediately on init to avoid overwriting
      }
    });
  }

  // Get data from localStorage (Synchronous for app performance)
  getData(key) {
    try {
      const data = localStorage.getItem(`business_ledger_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  // Save data to localStorage AND Server
  saveData(key, value, sync = true) {
    try {
      // 1. Save locally
      localStorage.setItem(`business_ledger_${key}`, JSON.stringify(value));

      // 2. Sync to server (Fire and forget)
      if (sync && this.isOnline) {
        fetch(`${this.serverUrl}/storage/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value)
        }).catch(err => console.error(`Sync failed for ${key}:`, err));
      }
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add item to collection
  addItem(collection, item) {
    const data = this.getData(collection) || [];
    item.id = item.id || this.generateId();
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.push(item);
    this.saveData(collection, data);
    return item;
  }

  // Update item in collection
  updateItem(collection, id, updates) {
    const data = this.getData(collection) || [];
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveData(collection, data);
      return data[index];
    }
    return null;
  }

  // Delete item from collection
  deleteItem(collection, id) {
    const data = this.getData(collection) || [];
    const filtered = data.filter(item => item.id !== id);
    this.saveData(collection, filtered);
    return filtered.length < data.length;
  }

  // Get item by ID
  getItemById(collection, id) {
    const data = this.getData(collection) || [];
    return data.find(item => item.id === id);
  }

  // Filter items
  filterItems(collection, predicate) {
    const data = this.getData(collection) || [];
    return data.filter(predicate);
  }

  // Save image to storage
  async saveImage(imageData, type, id) {
    try {
      // If base64 (from camera/upload)
      if (this.isOnline && imageData.startsWith('data:image')) {
        // Convert base64 to blob/file for upload
        const blob = await (await fetch(imageData)).blob();
        const formData = new FormData();
        formData.append('image', blob, `${type}_${id}.jpg`);

        const response = await fetch(`${this.serverUrl}/upload`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          // Store the RELATIVE path returned by server, not the big base64 string
          const serverPath = result.path; // e.g., "images/2023-10/123.jpg"

          // We map the object ID to this path in a special look-up or just return it
          // For backward compatibility, we'll store the path in a lookup, but also return it

          // Note: The UI expects base64 to show immediately. 
          // We should ideally return the base64 for immediate display, but save the URL for persistence.

          // To be compatible with old 'saveImage' which didn't modify the object directly but stored key:
          // We'll update the 'images' collection map.
          let imageMap = this.getData('image_map') || {};
          imageMap[`${type}_${id}`] = serverPath;
          this.saveData('image_map', imageMap);

          return {
            path: serverPath,
            url: `${this.serverUrl.replace('/api', '')}/${serverPath}`, // Construct full URL for display
            filename: result.filename,
            savedAt: new Date().toISOString()
          };
        }
      }

      // Fallback: LocalStorage Base64
      const imageKey = `image_${type}_${id}`;
      localStorage.setItem(imageKey, imageData);

      return {
        path: 'local',
        url: imageData,
        filename: 'local.jpg',
        savedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }

  // Get image from storage
  getImage(type, id) {
    // 1. Check server-synced map
    const imageMap = this.getData('image_map');
    if (imageMap && imageMap[`${type}_${id}`]) {
      // Return full server URL or relative path?
      // Server URL: http://localhost:3000/images/foo.jpg
      return `${this.serverUrl.replace('/api', '')}/${imageMap[`${type}_${id}`]}`;
    }

    // 2. Fallback to localStorage base64
    const imageKey = `image_${type}_${id}`;
    return localStorage.getItem(imageKey);
  }

  // Export/Import helpers (unchanged...)
  exportToJSON(collection) {
    const data = this.getData(collection);
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importFromJSON(collection, file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      this.saveData(collection, data);
      return true;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return false;
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('business_ledger_'));
      keys.forEach(key => localStorage.removeItem(key));
      this.initializeStorage();
      return true;
    }
    return false;
  }

  getStats() {
    return {
      parties: (this.getData('parties') || []).length,
      purchases: (this.getData('purchases') || []).length,
      sales: (this.getData('sales') || []).length,
      payments: (this.getData('payments') || []).length,
      stockItems: (this.getData('stock') || []).length
    };
  }
}

// Create global instance
window.storage = new StorageManager();
