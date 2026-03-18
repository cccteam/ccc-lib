import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SwrCacheService {
  private cache = new Map<string, unknown>();

  private readonly MAX_CACHE_SIZE = 1000;

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  /** Set or update a cache entry
   *
   * Insertion order is preserved, so deletion of entries is needed
   * both to ensure that existing entries are moved to the 'front' of the cache
   * and to ensure new entries remove the oldest entries to maintain cache size
   */
  set<T>(key: string, value: T): void {
    if (this.cache.has(key)) {
      // Delete and re-insert to move this entry to 'front' of cache
      this.cache.delete(key);
      this.cache.set(key, value);
      return;
    }

    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Delete 'oldest' entry to limit cache size
      this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, value);
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache = new Map();
  }
}
