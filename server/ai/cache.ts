import { ModelResponse } from "@shared/schema";

// Simple in-memory cache implementation for AI responses
export class AICache {
  private cache: Map<string, { response: ModelResponse; timestamp: number }>;
  private maxSize: number;
  private ttl: number; // Time-to-live in milliseconds
  
  constructor(maxSize: number = 1000, ttlMinutes: number = 30) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }
  
  /**
   * Get a cached response if it exists and is still valid
   */
  get(key: string): ModelResponse | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if the cached item has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }
  
  /**
   * Store a response in the cache
   */
  set(key: string, response: ModelResponse): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Evict expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Evict the oldest item from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
