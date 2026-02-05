// ===================================
// MONGODB STORAGE MANAGER
// ===================================

class StorageManager {
  constructor() {
    this.serverUrl = 'https://ledger-kappa-sage.vercel.app/api';
    this.isOnline = false;
    this.imagePath = './images/';
    this.cache = {}; // In-memory cache for performance
    this.initialized = false;

    // Attempt to initialize connection
    this.checkServerConnection();
  }

  async checkServerConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/settings`);
      this.isOnline = response.ok;
      if (this.isOnline) {
        console.log('✅ Connected to MongoDB Storage Server');
        await this.initializeStorage();
      } else {
        console.error('❌ Server connection failed with status:', response.status);
        throw new Error('Server not available');
      }
    } catch (e) {
      console.error('❌ Server not found. MongoDB storage requires a server connection.');
      this.isOnline = false;
      // Show error to user - app cannot work without server
      this.showOfflineError();
    }
  }

  showOfflineError() {
    const message = '⚠️ Cannot connect to MongoDB server. Please ensure the server is running and accessible.';
    console.error(message);
    // Optionally show UI notification
    if (document.body) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 10000;
        font-weight: bold;
      `;
      notification.textContent = message;
      document.body.insertBefore(notification, document.body.firstChild);
    }
  }

  // Initialize storage - ensure MongoDB is connected and ready
  async initializeStorage() {
    if (this.initialized) return;
    
    try {
      // Test connection and initialize collections
      const collections = ['parties', 'purchases', 'sales', 'payments', 'stock', 'settings', 'stock_movements', 'alerts', 'image_map'];
      
      for (const collection of collections) {
        try {
          await fetch(`${this.serverUrl}/storage/${collection}`);
        } catch (e) {
          console.error(`Failed to initialize collection: ${collection}`, e);
        }
      }
      
      this.initialized = true;
      console.log('✅ Storage initialized with MongoDB');
      window.dispatchEvent(new CustomEvent('storage-initialized'));
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // Get data from MongoDB
  async getData(key) {
    if (!this.isOnline) {
      console.error('❌ Cannot read data: Server offline');
      return null;
    }

    try {
      // Check cache first
      if (this.cache[key]) {
        return this.cache[key];
      }

      const response = await fetch(`${this.serverUrl}/storage/${key}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${key}: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache[key] = data;
      
      return data || (Array.isArray(data) ? [] : null);
    } catch (error) {
      console.error(`Error reading ${key} from MongoDB:`, error);
      return null;
    }
  }

  // Get data synchronously from cache (with fallback to empty array/object)
  getDataSync(key) {
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }
    return Array.isArray(this.cache[key]) ? [] : null;
  }

  // Save data to MongoDB
  async saveData(key, value, sync = true) {
    if (!this.isOnline) {
      console.error('❌ Cannot save data: Server offline');
      return false;
    }

    try {
      // Update cache immediately for responsive UI
      this.cache[key] = value;

      if (sync) {
        const response = await fetch(`${this.serverUrl}/storage/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value)
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${key}: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ Saved ${key} to MongoDB`);
        return result.success || true;
      }

      return true;
    } catch (error) {
      console.error(`Error saving ${key} to MongoDB:`, error);
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add item to collection
  async addItem(collection, item) {
    const data = await this.getData(collection) || [];
    item.id = item.id || this.generateId();
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.push(item);
    await this.saveData(collection, data);
    return item;
  }

  // Update item in collection
  async updateItem(collection, id, updates) {
    const data = await this.getData(collection) || [];
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveData(collection, data);
      return data[index];
    }
    return null;
  }

  // Delete item from collection
  async deleteItem(collection, id) {
    const data = await this.getData(collection) || [];
    const filtered = data.filter(item => item.id !== id);
    await this.saveData(collection, filtered);
    return filtered.length < data.length;
  }

  // Get item by ID
  async getItemById(collection, id) {
    const data = await this.getData(collection) || [];
    return data.find(item => item.id === id);
  }

  // Filter items
  async filterItems(collection, predicate) {
    const data = await this.getData(collection) || [];
    return data.filter(predicate);
  }

  // Save image to MongoDB storage
  async saveImage(imageData, type, id) {
    try {
      if (!this.isOnline) {
        console.error('❌ Cannot save image: Server offline');
        return null;
      }

      // If base64 (from camera/upload)
      if (imageData.startsWith('data:image')) {
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
          const serverPath = result.path;

          // Store image path mapping in MongoDB
          let imageMap = await this.getData('image_map') || {};
          imageMap[`${type}_${id}`] = serverPath;
          await this.saveData('image_map', imageMap);

          return {
            path: serverPath,
            url: `${this.serverUrl.replace('/api', '')}/${serverPath}`,
            filename: result.filename,
            savedAt: new Date().toISOString()
          };
        }
      }

      console.error('Failed to upload image');
      return null;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }

  // Get image from MongoDB storage
  async getImage(type, id) {
    try {
      // Check server-synced map
      const imageMap = await this.getData('image_map');
      if (imageMap && imageMap[`${type}_${id}`]) {
        return `${this.serverUrl.replace('/api', '')}/${imageMap[`${type}_${id}`]}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting image:', error);
      return null;
    }
  }

  // Export data to JSON
  async exportToJSON(collection) {
    const data = await this.getData(collection);
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Import data from JSON
  async importFromJSON(collection, file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await this.saveData(collection, data);
      return true;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return false;
    }
  }

  // Clear all data from MongoDB
  async clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        const collections = ['parties', 'purchases', 'sales', 'payments', 'stock', 'settings', 'stock_movements', 'alerts'];
        
        for (const collection of collections) {
          await this.saveData(collection, []);
        }
        
        // Clear cache
        this.cache = {};
        
        console.log('✅ All data cleared from MongoDB');
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        return false;
      }
    }
    return false;
  }

  // Get statistics
  async getStats() {
    try {
      return {
        parties: (await this.getData('parties') || []).length,
        purchases: (await this.getData('purchases') || []).length,
        sales: (await this.getData('sales') || []).length,
        payments: (await this.getData('payments') || []).length,
        stockItems: (await this.getData('stock') || []).length
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        parties: 0,
        purchases: 0,
        sales: 0,
        payments: 0,
        stockItems: 0
      };
    }
  }
}

// Create global instance
window.storage = new StorageManager();
