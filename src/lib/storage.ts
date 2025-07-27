// Simple file-based storage for development
// In production, replace with a proper database
import fs from 'fs';
import path from 'path';

const storageFile = path.join(process.cwd(), '.storage.json');

interface Store {
  id: string;
  username: string;
  addedAt: string;
}

interface StorageData {
  usernames?: Record<string, string>;
  stores?: Store[];
}

function loadStorage(): StorageData {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading storage:', error);
  }
  return {};
}

function saveStorage(data: StorageData) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving storage:', error);
  }
}

export const userDiscogsUsernames = {
  get(userId: string): string | undefined {
    const data = loadStorage();
    return data.usernames?.[userId];
  },
  
  set(userId: string, username: string): void {
    const data = loadStorage();
    if (!data.usernames) data.usernames = {};
    data.usernames[userId] = username;
    saveStorage(data);
  },
  
  entries(): [string, string][] {
    const data = loadStorage();
    return Object.entries(data.usernames || {});
  }
};

export const adminStores = {
  getAll(): Store[] {
    const data = loadStorage();
    return data.stores || [];
  },
  
  add(username: string): Store {
    const data = loadStorage();
    if (!data.stores) data.stores = [];
    
    const store: Store = {
      id: Date.now().toString(),
      username,
      addedAt: new Date().toISOString(),
    };
    
    data.stores.push(store);
    saveStorage(data);
    
    return store;
  },
  
  remove(id: string): boolean {
    const data = loadStorage();
    if (!data.stores) return false;
    
    const initialLength = data.stores.length;
    data.stores = data.stores.filter((store: Store) => store.id !== id);
    
    if (data.stores.length < initialLength) {
      saveStorage(data);
      return true;
    }
    
    return false;
  }
};