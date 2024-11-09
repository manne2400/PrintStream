import { Database } from './setup'
import { validateLicenseKey } from '../utils/license';

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
  profit_margin: number;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  bank_details: string;
  vat_id: string;
  dark_mode: boolean;
}

export interface PrintJob {
  id?: number;
  project_id: number;
  customer_id?: number | null;
  date: string;
  quantity: number;
  price_per_unit: number;
  status: 'pending' | 'printing' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface Sale {
  id?: number;
  project_id: number;
  customer_id: number | null;
  print_job_id: number;
  invoice_number: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_due_date: string;
  notes: string;
  project_name: string;
  customer_name: string | null;
  material_cost: number;
  printing_cost: number;
  processing_cost: number;
  extra_costs: number;
  currency: string;
  created_at?: string;
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

  async getProjectById(id: number): Promise<Project | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM projects WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row as Project || null);
        }
      );
    });
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

  async getCustomerById(id: number): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM customers WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row as Customer || null);
        }
      );
    });
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
      currency: 'EUR',
      profit_margin: 0,
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

  async getCurrency(): Promise<string> {
    const settings = await this.db.get('SELECT currency FROM settings LIMIT 1');
    return settings?.currency || 'EUR';
  }
}

export class PrintJobOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllPrintJobs(): Promise<PrintJob[]> {
    // Simpel SELECT uden nogen form for gruppering eller manipulation
    return this.db.all(`
      SELECT pj.*, p.name as project_name, c.name as customer_name
      FROM print_jobs pj
      LEFT JOIN projects p ON pj.project_id = p.id
      LEFT JOIN customers c ON pj.customer_id = c.id
      ORDER BY pj.date DESC
    `);
  }

  async addPrintJob(printJob: Omit<PrintJob, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO print_jobs (project_id, customer_id, date, quantity, price_per_unit, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        printJob.project_id,
        printJob.customer_id,
        printJob.date,
        printJob.quantity,
        printJob.price_per_unit,
        printJob.status
      ]
    );
    
    // Konsolider efter tilføjelse
    await this.consolidatePrintJobs();
    
    return result.lastID;
  }

  async calculateProjectCosts(projectId: number): Promise<{
    materialCost: number;
    printingCost: number;
    postProcessingCost: number;
    extraCosts: number;
    totalCost: number;
  }> {
    const project = await this.db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    const filaments = await this.db.all(`
      SELECT f.price, pf.amount
      FROM project_filaments pf
      JOIN filaments f ON pf.filament_id = f.id
      WHERE pf.project_id = ?
    `, [projectId]);
    
    const settings = await this.db.get('SELECT * FROM settings LIMIT 1');
    
    const materialCost = filaments.reduce((total, f) => total + (f.price * f.amount / 1000), 0);
    const printingCost = (project.print_time / 60) * (settings.printer_hourly_rate || 100);
    const postProcessingCost = (project.post_processing_time / 60) * (settings.post_processing_cost || 100);
    const extraCosts = project.extra_costs || 0;
    
    return {
      materialCost,
      printingCost,
      postProcessingCost,
      extraCosts,
      totalCost: materialCost + printingCost + postProcessingCost + extraCosts
    };
  }

  async updatePrintJob(id: number, updates: Partial<PrintJob>): Promise<void> {
    const { project_name, customer_name, ...dbUpdates } = updates;
    
    const updates_sql = Object.keys(dbUpdates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(dbUpdates), id];
    
    await this.db.run(`UPDATE print_jobs SET ${updates_sql} WHERE id = ?`, values);
  }

  async deletePrintJob(id: number): Promise<void> {
    await this.db.run('DELETE FROM print_jobs WHERE id = ?', [id]);
  }

  async deleteProjectPrints(projectId: number): Promise<void> {
    await this.db.run('DELETE FROM print_jobs WHERE project_id = ?', [projectId]);
  }

  async getPrintJobById(id: number): Promise<PrintJob | null> {
    return this.db.get(`
      SELECT pj.*, p.name as project_name 
      FROM print_jobs pj
      LEFT JOIN projects p ON pj.project_id = p.id
      WHERE pj.id = ?
    `, [id]);
  }

  async getAvailableQuantity(projectId: number): Promise<number> {
    // Hent projekt og dets filamenter
    const projectFilaments = await this.db.all(`
      SELECT pf.*, f.stock
      FROM project_filaments pf
      JOIN filaments f ON pf.filament_id = f.id
      WHERE pf.project_id = ?
    `, [projectId]);

    // Beregn max antal mulige prints baseret på filament beholdning
    let maxQuantity = Infinity;
    for (const pf of projectFilaments) {
      const possiblePrints = Math.floor(pf.stock / pf.amount);
      maxQuantity = Math.min(maxQuantity, possiblePrints);
    }

    return maxQuantity;
  }

  async getAllPrintJobsForSelect(): Promise<Array<{ id: number; project_name: string }>> {
    // Hent kun completed print jobs
    const jobs = await this.db.all(`
      SELECT pj.id, p.name as project_name
      FROM print_jobs pj
      LEFT JOIN projects p ON pj.project_id = p.id
      WHERE pj.status = 'completed'  // Kun completed jobs
      ORDER BY p.name ASC
    `);

    return jobs;
  }

  async consolidatePrintJobs(): Promise<void> {
    try {
      await this.db.run('BEGIN TRANSACTION');

      // Find grupper af print jobs der skal konsolideres
      const groups = await this.db.all(`
        SELECT 
          project_id,
          status,
          COUNT(*) as count,
          SUM(quantity) as total_quantity,
          MIN(id) as keep_id
        FROM print_jobs
        GROUP BY project_id, status
        HAVING count > 1
      `);

      // For hver gruppe
      for (const group of groups) {
        // Opdater det første print job med den samlede mængde
        await this.db.run(`
          UPDATE print_jobs 
          SET quantity = ?,
              date = (SELECT MIN(date) FROM print_jobs WHERE project_id = ? AND status = ?)
          WHERE id = ?
        `, [group.total_quantity, group.project_id, group.status, group.keep_id]);

        // Slet de andre print jobs i gruppen
        await this.db.run(`
          DELETE FROM print_jobs 
          WHERE project_id = ? 
          AND status = ? 
          AND id != ?
        `, [group.project_id, group.status, group.keep_id]);
      }

      await this.db.run('COMMIT');
    } catch (err) {
      await this.db.run('ROLLBACK');
      throw err;
    }
  }
}

export class SalesOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllSales(): Promise<Sale[]> {
    return this.db.all(`
      SELECT * FROM sales ORDER BY sale_date DESC
    `);
  }

  async addSale(sale: Omit<Sale, 'id' | 'created_at'>): Promise<number> {
    try {
      // Start en transaktion
      await this.db.run('BEGIN TRANSACTION');

      // Tilføj salget
      const result = await this.db.run(`
        INSERT INTO sales (
          project_id, customer_id, print_job_id, invoice_number,
          sale_date, quantity, unit_price, total_price,
          payment_status, payment_due_date, notes,
          project_name, customer_name,
          material_cost, printing_cost, processing_cost, extra_costs,
          currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.project_id,
        sale.customer_id,
        sale.print_job_id,
        sale.invoice_number,
        sale.sale_date,
        sale.quantity,
        sale.unit_price,
        sale.total_price,
        sale.payment_status,
        sale.payment_due_date,
        sale.notes,
        sale.project_name,
        sale.customer_name,
        sale.material_cost,
        sale.printing_cost,
        sale.processing_cost,
        sale.extra_costs,
        sale.currency
      ]);

      // Opdater print job status til 'completed'
      await this.db.run(
        'UPDATE print_jobs SET status = ?, quantity = quantity - ? WHERE id = ?',
        ['completed', sale.quantity, sale.print_job_id]
      );

      // Træk fra filament lager
      const projectFilaments = await this.db.all(`
        SELECT pf.filament_id, pf.amount, f.stock
        FROM project_filaments pf
        JOIN filaments f ON pf.filament_id = f.id
        WHERE pf.project_id = ?
      `, [sale.project_id]);

      // Opdater filament beholdning
      for (const pf of projectFilaments) {
        const newStock = pf.stock - (pf.amount * sale.quantity);
        await this.db.run(
          'UPDATE filaments SET stock = ? WHERE id = ?',
          [newStock, pf.filament_id]
        );
      }

      // Commit transaktionen
      await this.db.run('COMMIT');

      return result.lastID;
    } catch (err) {
      // Hvis noget går galt, ruller vi tilbage
      await this.db.run('ROLLBACK');
      throw err;
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const result = await this.db.get(
      "SELECT MAX(CAST(SUBSTR(invoice_number, 6) AS INTEGER)) as max_num FROM sales WHERE invoice_number LIKE ?",
      [`${currentYear}-%`]
    );
    const nextNum = (result?.max_num || 0) + 1;
    return `${currentYear}-${String(nextNum).padStart(4, '0')}`;
  }

  async updatePaymentStatus(id: number, status: 'pending' | 'paid' | 'cancelled'): Promise<void> {
    await this.db.run(
      'UPDATE sales SET payment_status = ? WHERE id = ?',
      [status, id]
    );
  }

  async deleteSale(id: number): Promise<void> {
    await this.db.run('DELETE FROM sales WHERE id = ?', [id]);
  }
}

export class LicenseOperations {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async checkLicense(): Promise<{
    isValid: boolean;
    daysLeft: number;
    expiryDate: string;
  }> {
    const license = await this.db.get('SELECT * FROM license LIMIT 1');
    const now = new Date();
    const expiry = new Date(license.expiry_date);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isValid: daysLeft > 0,
      daysLeft: Math.max(0, daysLeft),
      expiryDate: license.expiry_date
    };
  }

  async extendLicense(licenseKey: string): Promise<boolean> {
    try {
      // Tjek om licensen allerede er brugt
      const usedLicense = await this.db.get(
        'SELECT * FROM used_licenses WHERE license_key = ?',
        [licenseKey]
      );

      if (usedLicense) {
        console.log('License key already used');
        return false;
      }

      const validation = validateLicenseKey(licenseKey);
      if (!validation.isValid || !validation.days) {
        console.log('Invalid license key');
        return false;
      }

      // Hent nuværende licens info
      const currentLicense = await this.db.get('SELECT * FROM license WHERE id = 1');
      const currentExpiry = new Date(currentLicense.expiry_date);
      
      // Beregn ny udløbsdato ved at tilføje dage til den eksisterende udløbsdato
      const newExpiryDate = new Date(currentExpiry);
      newExpiryDate.setDate(currentExpiry.getDate() + validation.days);

      // Gem licensen som brugt
      const installationId = await this.getInstallationId();
      await this.db.run(
        `INSERT INTO used_licenses (
          license_key, 
          first_used_date, 
          installation_id
        ) VALUES (?, datetime('now'), ?)`,
        [licenseKey, installationId]
      );
      
      // Opdater licensen med den nye udløbsdato
      await this.db.run(`
        UPDATE license 
        SET expiry_date = ?,
            license_key = ?
        WHERE id = 1
      `, [newExpiryDate.toISOString(), licenseKey]);
      
      return true;
    } catch (err) {
      console.error('Error extending license:', err);
      return false;
    }
  }

  private async getInstallationId(): Promise<string> {
    const license = await this.db.get('SELECT installation_id FROM license WHERE id = 1');
    if (license?.installation_id) {
      return license.installation_id;
    }
    
    // Generer ny installations-id hvis den ikke findes
    const newId = 'inst_' + Math.random().toString(36).substr(2, 9);
    await this.db.run(
      'UPDATE license SET installation_id = ? WHERE id = 1',
      [newId]
    );
    return newId;
  }

  async getUsedLicenses(): Promise<Array<{
    license_key: string;
    first_used_date: string;
    installation_id: string;
  }>> {
    return this.db.all('SELECT * FROM used_licenses ORDER BY first_used_date DESC');
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  async checkAndUpdateVersion(currentVersion: string): Promise<boolean> {
    try {
      console.log('Checking version:', currentVersion);

      // Hent seneste version og licens info
      const lastVersion = await this.db.get(
        'SELECT version, installation_id FROM app_versions ORDER BY install_date DESC LIMIT 1'
      );
      const license = await this.db.get('SELECT license_key, expiry_date FROM license WHERE id = 1');
      console.log('License info:', license);

      const currentInstallId = await this.getInstallationId();

      // Hvis dette er en ny version
      if (this.compareVersions(currentVersion, lastVersion.version) > 0 &&
          lastVersion.installation_id === currentInstallId) {
        
        // Gem altid den nye version
        await this.db.run(
          'INSERT INTO app_versions (version, installation_id) VALUES (?, ?)',
          [currentVersion, currentInstallId]
        );

        // Hvis det er en prøvelicens (ingen licensnøgle)
        if (!license.license_key) {
          // Reset ALTID prøvelicens til 30 dage ved opgradering
          console.log('Trial license - resetting to 30 days');
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 30);
          await this.db.run(
            'UPDATE license SET expiry_date = ? WHERE id = 1',
            [newExpiryDate.toISOString()]
          );
          return true;
        } else {
          // Det er en rigtig licensnøgle
          const licenseStatus = await this.checkLicense();
          const daysLeft = licenseStatus.daysLeft;
          if (daysLeft < 30) {
            // Reset til 30 dage hvis der er mindre end 30 dage tilbage
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
            await this.db.run(
              'UPDATE license SET expiry_date = ? WHERE id = 1',
              [newExpiryDate.toISOString()]
            );
            return true;
          }
        }
      }

      return false;
    } catch (err) {
      console.error('Error checking version:', err);
      return false;
    }
  }
} 