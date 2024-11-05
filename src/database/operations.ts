import { Database } from './setup'

export interface Filament {
  id?: number
  name: string
  type: string
  color: string
  weight: number
  price: number
  stock: number
  ams_slot?: number | null
  created_at?: string
  low_stock_alert?: number
}

export class FilamentOperations {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async getAllFilaments(): Promise<Filament[]> {
    return this.db.all('SELECT * FROM filaments ORDER BY created_at DESC')
  }

  async addFilament(filament: Omit<Filament, 'id' | 'created_at'>): Promise<number> {
    if (filament.ams_slot !== undefined && filament.ams_slot !== null) {
      const existingFilament = await this.getFilamentByAmsSlot(filament.ams_slot);
      if (existingFilament) {
        throw new Error(`AMS slot ${filament.ams_slot} is already in use by ${existingFilament.name}`);
      }
    }

    const normalizePrice = (price: number) => {
      return Number(price.toFixed(2));
    };

    const result = await this.db.run(
      'INSERT INTO filaments (name, type, color, weight, price, stock, ams_slot, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        filament.name, 
        filament.type, 
        filament.color, 
        filament.weight, 
        normalizePrice(filament.price),
        filament.stock, 
        filament.ams_slot,
        filament.low_stock_alert ?? 500
      ]
    );
    return result.lastID;
  }

  async updateFilament(id: number, filament: Partial<Filament>): Promise<void> {
    if (filament.ams_slot !== undefined && filament.ams_slot !== null) {
      const existingFilament = await this.getFilamentByAmsSlot(filament.ams_slot);
      if (existingFilament && existingFilament.id !== id) {
        throw new Error(`AMS slot ${filament.ams_slot} is already in use by ${existingFilament.name}`);
      }
    }

    if (filament.price !== undefined) {
      filament.price = Number(filament.price.toFixed(2));
    }
    
    const updates = Object.keys(filament)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(filament), id];
    
    await this.db.run(`UPDATE filaments SET ${updates} WHERE id = ?`, values);
  }

  async deleteFilament(id: number): Promise<void> {
    await this.db.run(
      'DELETE FROM filaments WHERE id = ?',
      [id]
    );
  }

  async getLowStockFilaments(threshold: number = 500): Promise<Filament[]> {
    return this.db.all('SELECT * FROM filaments WHERE stock < ? ORDER BY stock ASC', [threshold])
  }

  async getFilamentByAmsSlot(amsSlot: number): Promise<Filament | undefined> {
    const result = await this.db.get(
      'SELECT * FROM filaments WHERE ams_slot = ?',
      [amsSlot]
    );
    return result;
  }
} 