import { JSONFilePreset } from "lowdb/node";
import { createLRUCacheProvider } from "./lru-cache"
import { Client } from "./client.js";
export class ClientRepository {
  cache = createLRUCacheProvider<Client>({ ttl: 100000, itemLimit: 100 });

  public async getById(id: string): Promise<Client | null> {
    const clientCache = this.cache.get(id)
    if (clientCache) {
      return clientCache
    }

    const db = await JSONFilePreset("db.json", {
      clients: [],
      users: [],
    });
    const clients = db.data.clients as Client[];
    let c: Client | null = null;
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id === id) {
        c = clients[i];
        break;
      }
    }
    if (!c) {
      return null;
    }
    return {
      id: c.id,
      name: c.name,
    };
  }

  public async getAll(): Promise<Client[]> {
    const db = await JSONFilePreset("db.json", {
      clients: [],
      users: [],
    });
    const clients = db.data.clients as Client[];
    return clients;
  }
}
