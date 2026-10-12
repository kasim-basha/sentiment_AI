/**
 * Robust IndexedDB Storage Engine for SentimentAI
 * Provides resilient, high-capacity client-side persistence without 5MB localStorage quota limits.
 */

const DB_NAME = "sentimentai_app_db";
const DB_VERSION = 1;
const STORE_POSTS = "community_posts";
const STORE_KEYVALUE = "key_value_store";

class DBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "indexedDB" in window;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported) {
      return Promise.reject(new Error("IndexedDB not supported in this environment"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_POSTS)) {
              db.createObjectStore(STORE_POSTS, { keyPath: "postId" });
            }
            if (!db.objectStoreNames.contains(STORE_KEYVALUE)) {
              db.createObjectStore(STORE_KEYVALUE, { keyPath: "key" });
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.warn("IndexedDB open error:", request.error);
            reject(request.error);
          };
        } catch (e) {
          reject(e);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Save all posts to IndexedDB
   */
  async savePosts(posts: any[]): Promise<void> {
    if (!this.isSupported) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_POSTS], "readwrite");
        const store = tx.objectStore(STORE_POSTS);

        // Clear existing and write updated list
        store.clear();
        posts.forEach(post => {
          store.put(post);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn("Error saving posts to IndexedDB:", err);
    }
  }

  /**
   * Load all posts from IndexedDB
   */
  async loadPosts(): Promise<any[] | null> {
    if (!this.isSupported) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_POSTS], "readonly");
        const store = tx.objectStore(STORE_POSTS);
        const request = store.getAll();

        request.onsuccess = () => {
          const result = request.result;
          resolve(Array.isArray(result) && result.length > 0 ? result : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn("Error loading posts from IndexedDB:", err);
      return null;
    }
  }

  /**
   * Set arbitrary key-value in IndexedDB
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    if (!this.isSupported) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_KEYVALUE], "readwrite");
        const store = tx.objectStore(STORE_KEYVALUE);
        store.put({ key, value });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`IndexedDB setItem failed for key ${key}:`, e);
    }
  }

  /**
   * Get arbitrary key-value from IndexedDB
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (!this.isSupported) return null;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_KEYVALUE], "readonly");
        const store = tx.objectStore(STORE_KEYVALUE);
        const req = store.get(key);
        req.onsuccess = () => {
          resolve(req.result ? req.result.value : null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB getItem failed for key ${key}:`, e);
      return null;
    }
  }
}

export const dbStorage = new DBStorage();
