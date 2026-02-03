// ===================================
// LOCAL JSON STORAGE MANAGER
// ===================================

class StorageManager {
  constructor() {
    this.dataPath = './data/';
    this.imagePath = './images/';
    this.initializeStorage();
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
        this.saveData(key, defaults[key]);
      }
    });
  }

  // Get data from localStorage
  getData(key) {
    try {
      const data = localStorage.getItem(`business_ledger_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  // Save data to localStorage
  saveData(key, value) {
    try {
      localStorage.setItem(`business_ledger_${key}`, JSON.stringify(value));
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
      const date = new Date();
      const folder = `${type}/${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const filename = `${id}_${Date.now()}.jpg`;
      const path = `${this.imagePath}${folder}/${filename}`;
      
      // In a real application, you would save to filesystem
      // For browser-based storage, we'll use IndexedDB or save as base64 in localStorage
      const imageKey = `image_${type}_${id}`;
      localStorage.setItem(imageKey, imageData);
      
      return {
        path,
        url: imageData,
        filename,
        savedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }

  // Get image from storage
  getImage(type, id) {
    const imageKey = `image_${type}_${id}`;
    return localStorage.getItem(imageKey);
  }

  // Export data to JSON file
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

  // Import data from JSON file
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

  // Clear all data (with confirmation)
  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('business_ledger_'));
      keys.forEach(key => localStorage.removeItem(key));
      this.initializeStorage();
      return true;
    }
    return false;
  }

  // Get statistics
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
