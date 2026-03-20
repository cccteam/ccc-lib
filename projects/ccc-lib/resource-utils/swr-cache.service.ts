import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SwrCacheService {
  private cache = new Map<unknown, unknown>();
  private rxCache = new Map<unknown, unknown>();

  private readonly MAX_CACHE_SIZE = 1000;

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  getRx<T>(key: unknown): T | undefined {
    return this.rxCache.get(key) as T | undefined;
  }

  /** Set or update a cache entry
   *
   * Insertion order is preserved, so deletion of entries is needed
   * both to ensure that existing entries are moved to the 'front' of the cache
   * and to ensure new entries remove the oldest entries to maintain cache size
   */
  set<T>(key: string, value: T): void {
    if (this.cache.has(key)) {
      // Moves the entry to 'front' of cache when set
      this.cache.delete(key);
    }

    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Deletes 'oldest' entry
      this.cache.delete(this.cache.keys().next().value!);
    }

    this.cache.set(key, value);
  }

  setRx<T>(key: unknown, value: T): void {
    if (this.rxCache.has(key)) {
      this.rxCache.delete(key);
    }
    if (this.rxCache.size >= this.MAX_CACHE_SIZE) {
      this.rxCache.delete(this.rxCache.keys().next().value!);
    }
    this.rxCache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache = new Map();
  }
}
