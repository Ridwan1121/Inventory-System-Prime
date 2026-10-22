// ============================================================
// DATABASE - SQLite (16 Tables)
// ============================================================
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('❌ Database error:', err.message);
    else { console.log('✅ SQLite connected:', DB_PATH); initDatabase(); }
});

function initDatabase() {
    db.serialize(() => {
        // OWNERS
        db.run(`CREATE TABLE IF NOT EXISTS owners (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, phone TEXT, country TEXT, is_main_owner INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // TENANTS
        db.run(`CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER, name TEXT NOT NULL,
            business_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT NOT NULL,
            phone_country TEXT, phone_international TEXT, password TEXT NOT NULL,
            language TEXT DEFAULT 'so', country TEXT, city TEXT, address TEXT, tax_id TEXT,
            domain TEXT UNIQUE, subdomain TEXT UNIQUE, plan TEXT DEFAULT 'free',
            plan_expires_at DATETIME, status TEXT DEFAULT 'active', is_verified INTEGER DEFAULT 0,
            twofa_secret TEXT, twofa_enabled INTEGER DEFAULT 0, currency TEXT DEFAULT 'USD',
            last_seen DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // PRODUCTS
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, name TEXT NOT NULL,
            category TEXT, price REAL NOT NULL, cost_price REAL, quantity INTEGER NOT NULL,
            sku TEXT, min_stock INTEGER DEFAULT 10, description TEXT, image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // CUSTOMERS
        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, name TEXT NOT NULL,
            email TEXT, phone TEXT, address TEXT, city TEXT, country TEXT, tax_id TEXT,
            credit_limit REAL DEFAULT 0, balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SALES
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, customer_id INTEGER,
            product_id INTEGER, product_name TEXT NOT NULL, quantity INTEGER NOT NULL,
            price REAL NOT NULL, tax REAL DEFAULT 0, discount REAL DEFAULT 0, total REAL NOT NULL,
            status TEXT DEFAULT 'completed', payment_method TEXT, invoice_number TEXT,
            customer_name TEXT, customer_phone TEXT, notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // EXPENSES
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, category TEXT NOT NULL,
            description TEXT, amount REAL NOT NULL, tax REAL DEFAULT 0, payment_method TEXT,
            receipt_url TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SUBSCRIPTIONS
        db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, plan TEXT NOT NULL,
            amount REAL NOT NULL, currency TEXT DEFAULT 'USD', billing_cycle TEXT DEFAULT 'monthly',
            status TEXT DEFAULT 'active', started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME, auto_renew INTEGER DEFAULT 1, payment_method TEXT, transaction_id TEXT)`);
        
        // INVOICES
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, subscription_id INTEGER,
            invoice_number TEXT UNIQUE NOT NULL, amount REAL NOT NULL, tax REAL DEFAULT 0,
            total REAL NOT NULL, currency TEXT DEFAULT 'USD', status TEXT DEFAULT 'pending',
            due_date DATETIME, paid_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SCHEDULES
        db.run(`CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, schedule_name TEXT NOT NULL,
            schedule_type TEXT NOT NULL, frequency TEXT NOT NULL, custom_interval INTEGER,
            days_of_week TEXT, time_of_day TEXT, start_date DATETIME, end_date DATETIME,
            is_active INTEGER DEFAULT 1, auto_connect INTEGER DEFAULT 1, last_run DATETIME,
            next_run DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SCHEDULE_LOGS
        db.run(`CREATE TABLE IF NOT EXISTS schedule_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER NOT NULL, tenant_id INTEGER NOT NULL,
            status TEXT, message TEXT, executed_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SESSIONS
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, session_token TEXT UNIQUE NOT NULL,
            refresh_token TEXT, ip_address TEXT, user_agent TEXT, language TEXT DEFAULT 'so',
            is_active INTEGER DEFAULT 1, last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // MESSAGES
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, sender_type TEXT NOT NULL,
            receiver_id INTEGER, receiver_type TEXT, tenant_id INTEGER, subject TEXT,
            message TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // AUDIT_LOGS
        db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, user_type TEXT, tenant_id INTEGER,
            action TEXT NOT NULL, details TEXT, ip_address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // SYSTEM_SETTINGS
        db.run(`CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT,
            description TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // NOTIFICATIONS
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER, user_type TEXT,
            title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // WAREHOUSES
        db.run(`CREATE TABLE IF NOT EXISTS warehouses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, name TEXT NOT NULL,
            address TEXT, city TEXT, country TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // WAREHOUSE_STOCK
        db.run(`CREATE TABLE IF NOT EXISTS warehouse_stock (
            id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, warehouse_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 0, UNIQUE(product_id, warehouse_id))`);
        
        // CUSTOM_REPORTS
        db.run(`CREATE TABLE IF NOT EXISTS custom_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, name TEXT NOT NULL,
            type TEXT NOT NULL, filters TEXT, columns TEXT, date_range TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // API_KEYS
        db.run(`CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, name TEXT NOT NULL,
            api_key TEXT UNIQUE NOT NULL, api_secret TEXT NOT NULL, permissions TEXT,
            status TEXT DEFAULT 'active', last_used DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // AI_CONVERSATIONS
        db.run(`CREATE TABLE IF NOT EXISTS ai_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, session_id TEXT,
            user_message TEXT NOT NULL, ai_response TEXT, language TEXT DEFAULT 'so',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
        // CREATE DEFAULT OWNER
        setTimeout(async () => {
            const ownerEmail = process.env.OWNER_EMAIL;
            const ownerPassword = process.env.OWNER_PASSWORD;
            if (!ownerEmail || !ownerPassword) {
                console.error('⚠️ Default owner not created: set OWNER_EMAIL and OWNER_PASSWORD in the environment.');
                return;
            }
            db.get('SELECT * FROM owners WHERE email = ?', [ownerEmail], async (err, owner) => {
                if (err) {
                    console.error('❌ Could not check for the default owner:', err.message);
                    return;
                }
                if (!owner) {
                    try {
                        const hash = await bcrypt.hash(ownerPassword, 10);
                        db.run('INSERT INTO owners (name, email, password, phone, country, is_main_owner) VALUES (?, ?, ?, ?, ?, 1)',
                            [process.env.OWNER_NAME || 'System Owner', ownerEmail, hash, '+252634008040', 'Somaliland'],
                            (err) => {
                                if (err) console.error('❌ Could not create the default owner:', err.message);
                                else console.log('👑 Default owner created.');
                            });
                    } catch (error) {
                        console.error('❌ Could not hash the default owner password:', error.message);
                    }
                }
            });
        }, 1000);
        
        console.log('✅ Database tables ready (20 tables)');
    });
}

module.exports = db;
