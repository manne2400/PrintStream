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
    const result = await this.db.run(
      'INSERT INTO filaments (name, type, color, weight, price, stock, ams_slot) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [filament.name, filament.type, filament.color, filament.weight, filament.price, filament.stock, filament.ams_slot]
    )
    return result.lastID
  }

  async updateFilament(id: number, filament: Partial<Filament>): Promise<void> {
    const updates = Object.keys(filament)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = [...Object.values(filament), id]
    
    await this.db.run(`UPDATE filaments SET ${updates} WHERE id = ?`, values)
  }

  async deleteFilament(id: number): Promise<void> {
    await this.db.run('DELETE FROM filaments WHERE id = ?', [id])
  }

  async getLowStockFilaments(threshold: number = 500): Promise<Filament[]> {
    return this.db.all('SELECT * FROM filaments WHERE stock < ? ORDER BY stock ASC', [threshold])
  }
} 