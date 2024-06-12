import QuickLRU from 'quick-lru';

export interface Cache<TKey, TValue> {
  has(key: TKey): boolean;
  get(key: TKey): TValue | undefined;
  set(key: TKey, value: TValue): void;
}

export interface LruCacheProps {
  /**
   * The maximum number of items in the cache.
   */
  readonly maxSize: number;
}

export class LruCache {
  private readonly cache: QuickLRU<string, string>;

  constructor(props: LruCacheProps) {
    this.cache = new QuickLRU({ maxSize: props.maxSize });
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }
}
