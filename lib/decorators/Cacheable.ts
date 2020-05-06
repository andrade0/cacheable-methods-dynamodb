import { getFinalKey } from '../util';
import { DynamoDbAdapterInstance } from '../adapters'

/**
 * Cacheable - This decorator allows you to first check if cached results for the
 *             decorated method exist. If so, return those, else run the decorated
 *             method, cache its return value, then return that value.
 *
 * @param ttl {number} number of days
 */
export function Cacheable(ttl: number, tableName: string = 'cache') {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    return {
      ...descriptor,
      value: async function(...args: any[]): Promise<any> {
        // Allow a client to be passed in directly for granularity, else use the connected
        // client from the main CacheManager singleton.
        const client = DynamoDbAdapterInstance;

        // If there is no client, no-op is enabled (else we would have thrown before),
        // just return the result of the decorated method (no caching)
        if (!client) {
          // A caching client must exist if not set to noop, otherwise this library is doing nothing.
          console.warn('type-cacheable @Cacheable was not set up with a caching client. Without a client, type-cacheable is not serving a purpose.');
          return descriptor.value!.apply(this, args);
        }

        const contextToUse = this;

        const finalKey = getFinalKey(propertyKey, args, contextToUse);

        client.setTableName(tableName);

        try {
          const cachedValue = await client.get(finalKey);

          // If a value for the cacheKey was found in cache, simply return that.
          if (cachedValue !== undefined && cachedValue !== null) {
            return cachedValue;
          }
        } catch (err) {
          console.warn(`type-cacheable Cacheable cache miss due to client error: ${err.message}`);
        }

        // On a cache miss, run the decorated function and cache its return value.
        const result = await descriptor.value!.apply(this, args);

        try {
          await client.set(finalKey, result, ttl);
        } catch (err) {
          console.warn(`type-cacheable Cacheable set cache failure due to client error: ${err.message}`);
        }
        return result;
      },
    };
  };
};
