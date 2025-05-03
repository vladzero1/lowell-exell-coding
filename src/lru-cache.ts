/**
 * A Least Recently Used (LRU) cache with Time-to-Live (TTL) support. Items are kept in the cache until they either
 * reach their TTL or the cache reaches its size and/or item limit. When the limit is exceeded, the cache evicts the
 * item that was least recently accessed (based on the timestamp of access). Items are also automatically evicted if they
 * are expired, as determined by the TTL.
 * An item is considered accessed, and its last accessed timestamp is updated, whenever `has`, `get`, or `set` is called with its key.
 *
 * Implement the LRU cache provider here and use the lru-cache.test.ts to check your implementation.
 * You're encouraged to add additional functions that make working with the cache easier for consumers.
 */

type LRUCacheProviderOptions = {
  ttl: number; // Time to live in milliseconds
  itemLimit: number;
};
type LRUCacheProvider<T> = {
  has: (key: string) => boolean;
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
};

// For TASK 2: Assume it's already implemented correctly and directly consume the lru-cache.ts implementation
// For TASK 3: Implement the LRU cache functionality by completing the `get`, `set`, and `has` methods in the `lru-cache.ts` file.

type CacheNode<T> = {
  next: CacheNode<T> | null;
  prev: CacheNode<T> | null;
  key: string;
  value: T;
  ttl: number;
}


export function createLRUCacheProvider<T>({
  ttl,
  itemLimit,
}: LRUCacheProviderOptions): LRUCacheProvider<T> {
  const valueMap = new Map<string, CacheNode<T>>()

  let NodeLinkList: CacheNode<T> | null = null
  let head: CacheNode<T> | null = null // this will be MRU
  let tail: CacheNode<T> | null = null // this will be the LRU
  const detach = (node: CacheNode<T>) => {
    node.next = null
    node.prev = null
  }

  const removeNode = (node: CacheNode<T>) => {
    // middle node
    if (node.prev && node.next) {
      node.prev.next = node.next
      node.next.prev = node.prev
      detach(node)
    }

    // head node
    if (node.prev && !node.next) {
      head = node.prev
      node.prev.next = null
      detach(node)
    }

    // tail node
    if (!node.prev && node.next) {
      tail = node.next
      node.next.prev = null
      detach(node)
    }
    valueMap.delete(node.key)
  }

  const checkAndRemoveLRUNode = () => {
    if (valueMap.size === itemLimit && tail) {
      valueMap.delete(tail.key)
      // handling only 1 node exist
      if (head && tail.key === head.key) {
        head = null
      }

      if (tail.next) {
        tail.next.prev = null
      }

      // need to remove the connection to data that is actually used
      detach(tail)
      tail = tail.next
    }
  }

  const registerNewNode = (key: string, value: T): CacheNode<T> => {
    checkAndRemoveLRUNode()

    // somehow the ternary operator cannot be used to assign null (if it is possible it will better to use ternary for convenience)
    let potentialPrev = null
    if (head) {
      potentialPrev = head
    }

    const newNode: CacheNode<T> = {
      next: null,
      prev: potentialPrev,
      key: key,
      value: value,
      ttl: ttl
    }
    if (potentialPrev) {
      potentialPrev.next = newNode
    }
    valueMap.set(key, newNode)
    head = newNode
    if (tail === null) {
      tail = newNode
    }

    return newNode
  }

  return {
    has: (key: string): boolean => {
      const node = valueMap.get(key)
      if (node) {
        // we need to remove old node and register new node to ensure the ttl reset and getting the new MRU node
        removeNode(node)
        registerNewNode(node.key, node.value)
        return true
      }

      return false;
    },
    get: (key: string): T | undefined => {
      const node = valueMap.get(key)
      if (node) {
        // we need to remove old node and register new node to ensure the ttl reset and getting the new MRU node
        removeNode(node)
        registerNewNode(node.key, node.value)
        return node.value
      }

      return undefined;
    },
    set: (key: string, value: T) => {
      // handling set data with same value
      // will remove the node with that value
      const currNode = valueMap.get(key)
      if (currNode) {
        removeNode(currNode)
      }

      registerNewNode(key, value)
      return;
    },
  };
}

// Example usage:
const cache = createLRUCacheProvider({ ttl: 100000, itemLimit: 10 });
cache.set("foo", "bar");
console.log(cache.get("foo")); // "bar"
console.log(cache.has("foo")); // true
console.log(cache.get("baz")); // undefined
