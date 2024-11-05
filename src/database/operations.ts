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

export interface Project {
  id?: number;
  name: string;
  description: string;
  print_time: number;
  post_processing_time: number;
  extra_costs: number;
  created_at?: string;
}

export interface ProjectFilament {
  id?: number;
  project_id: number;
  filament_id: number;
  amount: number;
  filament_name?: string;
  filament_type?: string;
  filament_color?: string;
}

export interface Customer {
  id?: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  vat_id: string;
  created_at?: string;
}

export interface Settings {
  id?: number;
  printer_hourly_rate: number;
  post_processing_cost: number;
  currency: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  bank_details: string;
  vat_id: string;
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

export class ProjectOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllProjects(): Promise<Project[]> {
    return this.db.all('SELECT * FROM projects ORDER BY created_at DESC');
  }

  async addProject(project: Omit<Project, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO projects (name, description, print_time, post_processing_time, extra_costs) VALUES (?, ?, ?, ?, ?)',
      [
        project.name,
        project.description,
        project.print_time,
        project.post_processing_time,
        project.extra_costs
      ]
    );
    return result.lastID;
  }

  async addProjectFilament(projectFilament: Omit<ProjectFilament, 'id'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO project_filaments (project_id, filament_id, amount) VALUES (?, ?, ?)',
      [
        projectFilament.project_id,
        projectFilament.filament_id,
        projectFilament.amount
      ]
    );
    return result.lastID;
  }

  async getProjectFilaments(projectId: number): Promise<ProjectFilament[]> {
    return this.db.all(`
      SELECT pf.*, f.name as filament_name, f.type as filament_type, f.color as filament_color
      FROM project_filaments pf
      JOIN filaments f ON pf.filament_id = f.id
      WHERE pf.project_id = ?
    `, [projectId]);
  }

  async updateProject(id: number, project: Partial<Project>): Promise<void> {
    const updates = Object.keys(project)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(project), id];
    
    await this.db.run(`UPDATE projects SET ${updates} WHERE id = ?`, values);
  }

  async deleteProject(id: number): Promise<void> {
    await this.db.run('DELETE FROM projects WHERE id = ?', [id]);
  }

  async deleteProjectFilament(id: number): Promise<void> {
    await this.db.run('DELETE FROM project_filaments WHERE id = ?', [id]);
  }
}

export class CustomerOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return this.db.all('SELECT * FROM customers ORDER BY name ASC');
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO customers (name, contact_person, email, phone, address, vat_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        customer.name,
        customer.contact_person,
        customer.email,
        customer.phone,
        customer.address,
        customer.vat_id
      ]
    );
    return result.lastID;
  }

  async updateCustomer(id: number, customer: Partial<Customer>): Promise<void> {
    const updates = Object.keys(customer)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(customer), id];
    
    await this.db.run(`UPDATE customers SET ${updates} WHERE id = ?`, values);
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.db.run('DELETE FROM customers WHERE id = ?', [id]);
  }
}

export class SettingsOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.db.get('SELECT * FROM settings LIMIT 1');
    return settings || {
      printer_hourly_rate: 100,
      post_processing_cost: 100,
      currency: 'DKK',
      company_name: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      bank_details: '',
      vat_id: ''
    };
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const updates = Object.keys(settings)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(settings);
    
    await this.db.run(`UPDATE settings SET ${updates} WHERE id = 1`, values);
  }
} 