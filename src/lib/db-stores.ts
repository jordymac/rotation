import { getDatabase } from './db';

interface Store {
  id: string;
  username: string;
  addedAt: string;
}

export const dbStores = {
  async getAll(): Promise<Store[]> {
    try {
      const db = await getDatabase();
      
      // Create stores table if it doesn't exist
      await db.none(`
        CREATE TABLE IF NOT EXISTS admin_stores (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          added_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      const stores = await db.any(`
        SELECT id::text, username, added_at::text as "addedAt"
        FROM admin_stores 
        ORDER BY added_at DESC
      `);
      
      return stores;
    } catch (error) {
      console.error('Error getting stores:', error);
      return [];
    }
  },

  async add(username: string): Promise<Store> {
    const db = await getDatabase();
    
    // Create stores table if it doesn't exist
    await db.none(`
      CREATE TABLE IF NOT EXISTS admin_stores (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        added_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const store = await db.one(`
      INSERT INTO admin_stores (username) 
      VALUES ($1) 
      ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
      RETURNING id::text, username, added_at::text as "addedAt"
    `, [username]);
    
    return store;
  },

  async remove(id: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.result('DELETE FROM admin_stores WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error removing store:', error);
      return false;
    }
  }
};